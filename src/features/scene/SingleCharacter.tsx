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
  ACTION_GO_TO_TOILET,
  ACTION_SIT_DESK_1,
  ACTION_SIT_OFFICE_CHAIR,
  ACTION_SIT_DESK_2,
  ACTIONS_BED_WEST,
  ACTIONS_BED_EAST,
  ACTIONS_BATHTUB,
  ACTION_SHOWER,
  ACTIONS_GARDEN_SOFA_EAST,
  ACTIONS_GARDEN_SOFA_WEST,
  ACTION_COOKING,
  ACTION_KALLAX_NE,
  ACTION_FRESH_AIR,
  ACTION_ENTREE_BAT_B,
  ACTION_ENTREE_COURS_BAT_B,
  ACTION_FULL_TOUR
} from './ai/ZoneNodes';
import type { AgentInstruction } from './ai/aiTypes';
import { useAgentController } from './ai/useAgentController';
import { appLog } from '@features/ui/AppConsole';
import { isAppIdle } from './idleState';

import { WALKER_ANIM_OPTIONS } from './animOptions';
export { WALKER_ANIM_OPTIONS };

const EMPTY_SCENARIO: AgentInstruction[] = [];

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
  const [expression, setExpression] = useState<'neutral' | 'smile' | 'wink'>('neutral');
  const expressionRef = useRef<'neutral' | 'smile' | 'wink'>('neutral');
  expressionRef.current = expression;

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
      case 'aiGoToilet': return ACTION_GO_TO_TOILET;
      case 'aiSitDesk1': return ACTION_SIT_DESK_1;
      case 'aiSitOfficeChair': return ACTION_SIT_OFFICE_CHAIR;
      case 'aiSitDesk2': return ACTION_SIT_DESK_2;
      case 'aiBedWest': return ACTIONS_BED_WEST[0];
      case 'aiBedEast': return ACTIONS_BED_EAST[0];
      case 'aiBathtub': return ACTIONS_BATHTUB[0];
      case 'aiShower': return ACTION_SHOWER;
      case 'aiGardenSofaEast': return ACTIONS_GARDEN_SOFA_EAST[0];
      case 'aiGardenSofaWest': return ACTIONS_GARDEN_SOFA_WEST[0];
      case 'aiCooking': return ACTION_COOKING;
      case 'aiKallaxNE': return ACTION_KALLAX_NE;
      case 'aiFreshAir': return ACTION_FRESH_AIR;
      default: return null;
    }
  }, [activeActionKey]);

  const delphinaScenario = useMemo(() => {
    if (id !== 'delphina' && id !== 'vivida' && id !== 'angelina' && id !== 'cha' && id !== 'sabira' && id !== 'lgbta' && id !== 'marissa') return null;
    const actions = [
      ACTION_SIT_DESK_1, ACTION_SIT_OFFICE_CHAIR, ACTION_SIT_DESK_2, ...ACTIONS_BED_WEST, ...ACTIONS_BED_EAST,
      ...ACTIONS_BATHTUB, ACTION_SHOWER, ...ACTIONS_GARDEN_SOFA_EAST, ...ACTIONS_GARDEN_SOFA_WEST,
      ACTION_COOKING, ACTION_KALLAX_NE, ACTION_FRESH_AIR, ACTION_GO_TO_TOILET,
      ACTION_ENTREE_BAT_B, ACTION_ENTREE_COURS_BAT_B
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
      'media/sandbox/anims/miley_armature_10_dance_like_sidestep.glb',
      'media/sandbox/anims/miley_armature_aerobic_dance.glb',
      'media/sandbox/anims/miley_armature_air_dance.glb',
      'media/sandbox/anims/miley_armature_couple_pop_dance_f.glb',
      'media/sandbox/anims/miley_armature_couple_pop_dance_m.glb',
      'media/sandbox/anims/miley_armature_dance_graceful.glb',
      'media/sandbox/anims/miley_armature_dancetomusic_f.glb',
      'media/sandbox/anims/miley_armature_energetic_dance_f.glb',
      'media/sandbox/anims/miley_armature_energetic_dance_m.glb',
      'media/sandbox/anims/miley_armature_sensual_dance_01.glb',
      'media/sandbox/anims/miley_armature_sensual_dance_02.glb',
      'media/sandbox/anims/miley_armature_sensual_dance_03.glb',
      'media/sandbox/anims/miley_armature_slow_dance_f.glb',
      'media/sandbox/anims/miley_armature_slow_dance_m.glb',
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

  const finalScenario = isGuidedTour ? activeActionScenario : (isDelphinaNpc ? delphinaScenario : EMPTY_SCENARIO);
  const loopScenario = isDelphinaNpc;

  const { update: updateAgent, setPosition: setAgentPosition, setRotation: setAgentRotation } = useAgentController(
    id,
    finalScenario,
    loopScenario, // Boucle uniquement si c'est le bot aléatoire (Delphina)
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
    isNPC ? (id === 'sandra' || id === 'rajaa' ? 9 * 3.0 : ((characterIndex ?? 0) + 1) * 3.0) : 0
  );

  useEffect(() => {
    const handleActivity = () => {
      invalidate();
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
        c.castShadow = characterShadows;
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
        const path = e.detail.value;

        if (path === 'idle') {
          customAnimName.current = null;
          userAnimOverrideRef.current = false;
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

            action.setLoop(THREE.LoopRepeat, Infinity);
            action.clampWhenFinished = false;

            customAnimName.current = path;
            userAnimOverrideRef.current = true;
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
        if (isGuidedTour) {
          const agentState = updateAgent(delta);
          groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
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
      (customIdleAnimPath && customIdleAnimPath.includes('dance')) ||
      Math.abs(groupRef.current.position.x - (groupRef.current.userData.prevX ?? groupRef.current.position.x)) > 0.01 ||
      Math.abs(groupRef.current.position.z - (groupRef.current.userData.prevZ ?? groupRef.current.position.z)) > 0.01
    );
    groupRef.current.userData.prevX = groupRef.current.position.x;
    groupRef.current.userData.prevZ = groupRef.current.position.z;

    // Inactive model is stationary unless active as NPC
    let isMoving = isActive ? cameraState.isMoving : isNpcActive;
    let target = isPreview ? (walkerAnim || 'idle') : (isMoving ? 'walk' : 'idle');

    // Si le joueur reprend le contrôle manuel (plus de visite guidée), effacer l'animation IA
    if (isActive && !isGuidedTour && customAnimName.current) {
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

    if (isNPC && customIdleAnimPath && target === 'idle') {
      target = customIdleAnimPath;
    }

    const to = actions[target];
    if (to && activeActionName.current !== target) {
        const from = activeActionName.current ? actions[activeActionName.current] : null;
        if (from) from.fadeOut(0.2);
        
        const isContinuous = target === 'idle' || target === 'walk' || target === 'run' || (isNPC && target === customIdleAnimPath);
        if (isContinuous) {
          to.setLoop(THREE.LoopRepeat, Infinity);
          to.clampWhenFinished = false;
        }

        to.reset().fadeIn(0.2).play();
        to.setEffectiveWeight(1);
        activeActionName.current = target;
    }

    if (!isPaused) {
        mixer.update(delta);

        // Physique réactive & Gravité universelle (sans vent/bruit continu au repos)

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

            const baseParentQuat = baseParent.getWorldQuaternion(new THREE.Quaternion());
            const g = new THREE.Vector3(0, -981, 0); // standard gravity (cm/s^2)

            for (const node of activeHairChain) {
              const { bone, relQuat, axis, worldLength } = node;
              const parent = bone.parent;
              if (!parent) continue;



              const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);

              const downWorld = new THREE.Vector3(0, -1, 0);
              const restDirWorld = axis.clone().applyQuaternion(baseParentQuat.clone().multiply(relQuat)).normalize();
              const restDir = downWorld.clone().lerp(restDirWorld, 0.15).normalize();
              const restTip = jointWorld.clone().addScaledVector(restDir, worldLength);

              // Teleportation safety reset
              const dist = jointWorld.distanceTo(node.tipWorld);
              if (dist > Math.max(worldLength * 3, 20.0)) {
                node.tipWorld.copy(restTip);
                node.tipPrev.copy(restTip);
              }

              const isHeadMoving = isMoving || (target !== 'idle') || (walkerAnim && walkerAnim.toLowerCase().includes('walk')) || (walkerAnim && walkerAnim.toLowerCase().includes('run'));
              const dampingFactor = isHeadMoving ? 0.75 : 0.85;

              const vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - dampingFactor));
              const next = new THREE.Vector3().copy(node.tipWorld).add(vel).addScaledVector(g, simDt * simDt);

              // Souplesse d'attraction vers le bas (gravité naturelle)
              const lerpStiffness = isHeadMoving ? 0.05 : 0.12;
              next.lerp(restTip, lerpStiffness);

              // Restitution et frein au repos si la vitesse est faible (immobilisation totale sans bruit)
              if (!isHeadMoving && vel.lengthSq() < 0.1) {
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
                if (headBoneRef.current && activeHairChain !== customHairChainRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(headBoneRef.current.matrixWorld).addScaledVector(backDir, 4);
                  const radius = 13.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Sac à dos (Collider Rectangulaire Plat OBB)
                if (spine2BoneRef.current && activeHairChain !== customHairChainRef.current) {
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
              if (!(window as any)._boneLogged && activeHairChain === customHairChainRef.current && node === activeHairChain[0]) {
                console.log(`[HairPhysics] wLen:${worldLength.toFixed(3)}, vel:${vel.length().toFixed(3)}, isHeadMoving:`, isHeadMoving, `Quat:`, bone.quaternion.toArray().map((n: number) => n.toFixed(3)));
                (window as any)._boneLogged = true;
                setTimeout(() => { (window as any)._boneLogged = false; }, 1000);
              }
              const parentWQuat = parent.getWorldQuaternion(new THREE.Quaternion());
              
              // Correct quaternion math: Swing from REST WORLD direction to CURRENT WORLD direction
              const boneRestWorldQuat = baseParentQuat.clone().multiply(relQuat);
              const swing = new THREE.Quaternion().setFromUnitVectors(restDirWorld, currentDirWorld);
              
              const newWorldQuat = swing.multiply(boneRestWorldQuat);
              bone.quaternion.copy(parentWQuat.invert().multiply(newWorldQuat));

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

    if (!isPaused) {
        invalidate();
    }
  });

  return (
    <group ref={groupRef} userData={{ animUnit: true, noAnim: true }}>
      <primitive ref={modelRef} object={scene} />
      
      {headBoneState && haircut !== 'original' && (
        [
          'hair_zepeto', 'hair_pigtails', 'hair_buns', 'hair_short_layers', 
          'hair_nmixx_hat_braids', 'hair_very_long', 'hair_two_braids_bangs', 
          'hair_aespa_short', 'hair_wavy_ponytail', 'hair_nimxx_short',
          'hair_short_combed', 'hair_low_bun', 'hair_high_bun',
          'hair_high_ponytail', 'hair_nmixx_short', 'hair_long_braids',
          'hair_nmixx_16', 'hair_zepeto_nmixx', 'hair_bob_buns', 'hair_wavy_ponytails',
          'hair_two_long_ponytails', 'hair_cyber_two_long_ponytails', 'hair_white_hair_with_bun',
          'hair_short_hair', 'hair_white_ponytail', 'hair_nmixx_hair_with_bangs',
          'hair_two_white_ponytails', 'hair_wolf_haircut', 'hair_white_bob_hairct',
          'hair_scbe_hair_combed_to_one_side', 'hair_wavy_wet_white_hair', 'hair_nyyd_wavy_hair',
          'hair_short_wavy_hair_with_bangs', 'hair_nmixxhair_whith_bangs', 'hair_long_hair_styled_to_the_sides',
          'hair_wavy_long_hair_with_bangs', 'hair_wavy_white_hair_to_one_side', 'hair_high_white_bunponytail',
          'hair_white_hair_arraged_to_one_side',
          'hair_black_long_hair', 'hair_blonde_ponytail_with_bangs', 'hair_bratz_curly_hair',
          'hair_bratz_long_hair', 'hair_chinook_wind_ponytail', 'hair_hair_bitten',
          'hair_kcon_long_hair', 'hair_long_down_ponytail', 'hair_long_hair_cut_in_layers',
          'hair_long_hair_with_bow', 'hair_medium_short_hair_combed_to_the_sides', 'hair_nmixx_white_hair',
          'hair_nmixx_white_longshort_hair', 'hair_noicepotatonp_osanahair', 'hair_side_swept_curls',
          'hair_straight_long_white_hair', 'hair_two_braids_with_red_ties', 'hair_vcha_long_white_hair',
          'hair_wavy_hair_arranged_to_one_side', 'hair_wavy_hair_with_bangs_02', 'hair_white_long_wavy_hair'
        ].includes(haircut as string) ? (
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

