/**
 * Character.tsx — Personnages (Characters).
 * Version modulaire intégrant animations, physique Verlet, styles/accessoires et agent IA.
 */
import { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getWalkCycleSpeed, walkTimeScale } from './walkCadence';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone, hasMountedGLTFClones } from '@features/scene/useGLTFClone';
import { enableAnimatedFrustumCulling } from '../utils/animatedFrustumCulling';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { Wig, HAIR_COLORS, disposeOwnedWigResources } from '../items/Wig';
import { CharacterPendant, type CharacterPendantHandle } from './CharacterPendant';
import { CharacterBaseballCap } from './CharacterBaseballCap';
import { applyLaraVariantStyles, disposeLaraVariantMaterials, applyLaraRealisticTextures } from '../LaraVariants';
import { isCharacterVisibleInMode, AUTONOMOUS_NPC_IDS, isExtraCharacter, findCharacter } from '../characterConfig';
import { disposeCharacterResources } from './characterDisposal';
import { buildHairChain } from '../retargeting/index';
import { glbLocalBBox } from '@features/scene/glbUtils';
import {
  extractCharacterParts,
  applyClothingAndAccessoriesVisibility,
  applyPistolVisibility,
  applyRenderProperties,
  normalizeNonLaraCharacterMaterials,
  isHeadMesh,
} from '../characterParts';
import { LAYER_WALKER_DETAIL } from '@config';
import { buildGuidedTour, buildConciergeTour } from '../ai/scenarios';
import { buildAutonomousActivities } from '../ai/autonomousActivities';
import type { AgentInstruction } from '../ai/aiTypes';
import { useAgentController, resetAgentDeployment } from '../ai/useAgentController';
import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import { measureHumanProfile } from '../ai/navigation/profiles';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';
import { duoSessionManager } from '../ai/duoSessionManager';
import { appLog } from '@features/ui/AppConsole';
import { resolveAnimationId, getAnimationOriginTransform, getAnimationDef } from '../animations/animationResolver';
import { getCrossfadeDuration, isPostureTransition, getPostureTransitionRotDelta } from '../animations/animationTransitions';
import { fitPostureTransition } from '../animations/postureTransition';

import type { CharacterProps } from './characterTypes';
import { updateCharacterLayers } from './characterLayers';
import { GroundPoint } from './GroundPoint';
import { HeartParachute, type HeartParachuteHandle } from './HeartParachute';
import { useCharacterFrame } from './CharacterRuntimeProvider';
import { characterRuntimeStats } from './characterRuntime';
import { useCharacterAnimations } from './useCharacterAnimations';
import { useCharacterPhysics } from './useCharacterPhysics';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import { getCharacterGridPosition } from './characterGridUtils';

function recordMixer(ms: number) {
  const metric = characterRuntimeStats.mixer;
  metric.calls++; metric.totalMs += ms; metric.maxMs = Math.max(metric.maxMs, ms);
}

const EMPTY_SCENARIO: AgentInstruction[] = [];
const _tmpLgbtaColorA = new THREE.Color();
const _tmpLgbtaColorB = new THREE.Color();
const _charFrustum = new THREE.Frustum();
const _charProjScreenMatrix = new THREE.Matrix4();
let _lastFrustumTime = -1;
function updateCharFrustum(cam: THREE.Camera, time: number) {
  if (time !== _lastFrustumTime) {
    _lastFrustumTime = time;
    _charProjScreenMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    _charFrustum.setFromProjectionMatrix(_charProjScreenMatrix);
  }
}
const _charBoundingSphere = new THREE.Sphere();
const _tmpHeadWorldPos = new THREE.Vector3();
const _tmpHeadRefPos = new THREE.Vector3();
const _tmpHipsWorldPos = new THREE.Vector3();
const _tmpLeftEyeWorldPos = new THREE.Vector3();
const _tmpRightEyeWorldPos = new THREE.Vector3();
const _tmpEyesWorldPos = new THREE.Vector3();
const _tmpHeadForward = new THREE.Vector3();
const _tmpHeadUp = new THREE.Vector3();
const _tmpAnimOrigin = new THREE.Vector3();

const LGBTA_HAIRCUTS = [
  'original',
  'hair_100', 'hair_101', 'hair_102', 'hair_103', 'hair_104',
  'hair_105', 'hair_106', 'hair_107', 'hair_108', 'hair_109',
  'hair_110', 'hair_111', 'hair_112'
];

const LGBTA_HAIR_COLORS = [
  'arc-en-ciel', 'rose', 'violet', 'bleu', 'vert', 'rouge',
  'blanc', 'blond', 'roux', 'brun', 'noir'
];

export function Character({
  id,
  name,
  modelPath,
  isLara,
  targetHeight,
  isActive,
  isPreview = false,
  characterIndex = 0,
  totalCharacters = 1,
  characterAnim = 'idle',
  isPaused = false,
  previewHaircut,
  previewHairColor,
  variant,
  isNPC = false,
  npcPosition = [0, 0, 0],
  npcRotationY = 0,
  previewPosition,
  previewRotationY,
  duoAnimDef,
  isDuoRoleB = false,
  instanceId,
  isGridPartner = false,
  isAnimationMaster,
}: CharacterProps) {
  const [localHaircut, setLocalHaircut] = useState<string>('original');
  const haircut = isPreview && previewHaircut ? previewHaircut : localHaircut;

  const [localHairColor, setLocalHairColor] = useState<string | undefined>(undefined);
  const hairColor = isPreview ? previewHairColor : localHairColor;

  const characterGrid = useSceneStore(state => state.layers.characterGrid);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const laraCount = useSceneStore(state => state.layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15));
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const activeMainIds = useSceneStore(state => state.activeMainIds);
  const showWallhack = useSceneStore(state => state.layers.wallhack);
  const showAccessories = useSceneStore(state => state.layers.accessories ?? true);
  const laraPistols = useSceneStore(state => state.layers.laraPistols ?? true);
  const laraTop = useSceneStore(state => state.layers.laraTop);
  const laraBottom = useSceneStore(state => state.layers.laraBottom);
  const laraShoes = useSceneStore(state => state.layers.laraShoes ?? true);
  const laraRealisticTextures = useSceneStore(state => state.layers.laraRealisticTextures ?? false);
  const characterShadows = useSceneStore(state => state.layers.characterShadows ?? true);
  const characterWireframe = useSceneStore(state => state.layers.characterWireframe ?? false);
  const animOriginLerp = useSceneStore(state => state.layers.animOriginLerp ?? false);
  const animCrossfade = useSceneStore(state => state.layers.animCrossfade ?? false);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const aiFullTour = useSceneStore(state => state.extraStates.aiFullTour);

  const navigationEnabled = useNavigationEnabled();
  const renderId = instanceId ?? (isPreview ? `${id}:preview` : !navigationEnabled ? `${id}:zone-preview` : id);
  const { scene } = useGLTFClone(modelPath, isGridPartner);
  const charLabel = name || (isNPC ? `PNJ (${id})` : `Personnage (${id})`);

  useLayoutEffect(() => {
    if (!scene) return;
    scene.name = charLabel;
    scene.userData = {
      ...scene.userData,
      name: charLabel,
      itemName: charLabel,
    };
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData = {
          ...child.userData,
          itemName: charLabel,
        };
        enableAnimatedFrustumCulling(child as THREE.Mesh);
        // Désactiver le raycast triangle par triangle sur les maillages haute résolution
        child.raycast = () => {};
      }
    });
  }, [scene, charLabel]);

  // Libération propre des ressources GPU (textures, matériaux, géométries), cache GLTF et retargeting au démontage
  useEffect(() => {
    return () => {
      disposeLaraVariantMaterials(scene);
      if (isGridPartner) {
        scene.traverse(child => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(material => material.dispose());
          }
        });
      }
      if (isExtraCharacter(id) && !hasMountedGLTFClones(modelPath)) {
        resetAgentDeployment(renderId);
        disposeCharacterResources(scene);
        useGLTF.clear(modelPath);
      }
    };
  }, [id, modelPath, scene, renderId, isGridPartner]);

  // Extraction structurée des maillages et des os
  const parts = useMemo(() => extractCharacterParts(scene), [scene]);
  const pendantRef = useRef<CharacterPendantHandle>(null);
  const parachuteRef = useRef<HeartParachuteHandle>(null);
  const headBone = parts.bones.head;
  // Os de référence pour la position réelle de la tête (minimap) : Lara expose head_neck_upper, les modèles Mixamo leur os Head
  const headRefBone = useMemo(
    () => (scene ? ((scene.getObjectByName('head_neck_upper') as THREE.Bone | null) ?? headBone) : null),
    [scene, headBone],
  );
  const hipsBone = parts.bones.hips;
  const leftEyeBone = useMemo(() => (scene ? (scene.getObjectByName('head_eyeball_left') as THREE.Bone | null) : null), [scene]);
  const rightEyeBone = useMemo(() => (scene ? (scene.getObjectByName('head_eyeball_right') as THREE.Bone | null) : null), [scene]);

  // Nettoyage de la référence de tête et d'yeux caméra quand le personnage n'est plus actif
  useEffect(() => {
    return () => {
      if (navigationEnabled && isActive && !isPreview) {
        cameraState.activeHeadPos = null;
        cameraState.activeHipsPos = null;
        cameraState.activeEyesPos = null;
        cameraState.activeHeadForward = null;
        cameraState.activeHeadUp = null;
      }
    };
  }, [isActive, isPreview, navigationEnabled]);

  const groupRef = useRef<THREE.Group>(null!);
  const animOriginRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const baseScenePosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const postureOriginRef = useRef({ position: new THREE.Vector3(), rotY: 0 });
  const postureClipsRef = useRef(new Map<string, { original: THREE.AnimationClip; fitted: THREE.AnimationClip }>());
  useEffect(() => () => postureClipsRef.current.clear(), [scene]);
  const prevFirstPersonRef = useRef<boolean | null>(null);
  const lastLoggedAnimRef = useRef<string>('');
  const [isFalling, setIsFalling] = useState<boolean>(false);

  const [equipment, _setEquipment] = useState<{ holster: boolean; pistols: boolean; backpack: boolean }>({
    holster: true,
    pistols: true,
    backpack: true,
  });
  const animationEquipmentRef = useRef<'dual-pistols' | 'holstered' | undefined>(undefined);

  const { invalidate } = useThree();

  // Sous-systèmes Animations & Physique
  const {
    mixerRef,
    actionsRef,
    activeActionName,
    currentAnimClip,
    loadAndPlayClip, retireAction, collectActions
  } = useCharacterAnimations({
    id: renderId,
    scene,
    invalidate,
    onRelease: animationId => postureClipsRef.current.delete(animationId),
  });

  const {
    hairChainRef,
    customHairChainRef,
    initPhysicsBones,
    updatePhysics
  } = useCharacterPhysics();

  // Rotation périodique coiffures et couleurs variant LGBT+ (toutes les 20s)
  useEffect(() => {
    if (variant === 'lgbta') {
      const interval = setInterval(() => {
        const nextHaircut = LGBTA_HAIRCUTS[Math.floor(Math.random() * LGBTA_HAIRCUTS.length)];
        const nextColor = LGBTA_HAIR_COLORS[Math.floor(Math.random() * LGBTA_HAIR_COLORS.length)];
        setLocalHaircut(nextHaircut);
        setLocalHairColor(nextColor);
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [variant]);

  // Synchronisation des layers (visibilité miroir vs FPV)
  useEffect(() => {
    if (groupRef.current) {
      const isFirstPerson = isActive && cameraState.isFirstPersonView();
      updateCharacterLayers(groupRef.current, isFirstPerson);
      prevFirstPersonRef.current = isFirstPerson;
    }
  }, [cameraMode, isActive]);

  // Masquage de la tête en mode FPV (1ère personne) pour les modèles à maillage unique (ex: mannequin)
  useEffect(() => {
    if (!scene || !headBone || !isActive) return;
    const hasSeparateHead = parts.allRenderMeshes.some(r => isHeadMesh(r.mesh));
    if (hasSeparateHead) return;

    const meshesToHook: THREE.Mesh[] = [];
    scene.traverse(child => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.SkinnedMesh).isSkinnedMesh) {
        meshesToHook.push(child as THREE.Mesh);
      }
    });

    const origHooks = meshesToHook.map(m => ({
      mesh: m,
      onBeforeRender: m.onBeforeRender,
      onAfterRender: m.onAfterRender,
    }));

    meshesToHook.forEach(mesh => {
      mesh.onBeforeRender = (_renderer, _sc, cam) => {
        const isFpv = cameraState.isFirstPersonView();
        if (isFpv && headBone) {
          const isMirror = (cam.layers.mask & (1 << LAYER_WALKER_DETAIL)) !== 0;
          if (isMirror) {
            headBone.scale.set(1, 1, 1);
          } else {
            headBone.scale.set(0.0001, 0.0001, 0.0001);
          }
          headBone.updateMatrixWorld(true);
        }
      };

      mesh.onAfterRender = () => {
        if (headBone && headBone.scale.x < 0.5) {
          headBone.scale.set(1, 1, 1);
          headBone.updateMatrixWorld(true);
        }
      };
    });

    return () => {
      origHooks.forEach(({ mesh, onBeforeRender, onAfterRender }) => {
        mesh.onBeforeRender = onBeforeRender;
        mesh.onAfterRender = onAfterRender;
      });
      if (headBone && headBone.scale.x < 0.5) {
        headBone.scale.set(1, 1, 1);
        headBone.updateMatrixWorld(true);
      }
    };
  }, [scene, headBone, isActive, parts]);

  // Gestion des scénarios IA
  const activeActionKey = useMemo(() => {
    if (aiFullTour) return 'aiFullTour';
    return null;
  }, [aiFullTour]);

  const activeActionScenario = useMemo(() => {
    if (!isPreview && id === activeCharacterId && activeActionKey === 'aiFullTour') {
      const position = groupRef.current?.position;
      return buildGuidedTour(position ? { x: position.x, z: position.z } : { x: npcPosition[0], z: npcPosition[2] });
    }
    return null;
  }, [activeActionKey, activeCharacterId, id, isPreview]);

  const agentEnabled = !isPreview && !isGridPartner && navigationEnabled && laraCount > 0 && !characterGrid;
  const isAutonomous = agentEnabled && AUTONOMOUS_NPC_IDS.has(id);
  const isGuidedTour = agentEnabled && Boolean(activeActionKey && id === activeCharacterId);

  const autonomousScenario = useMemo(() => {
    if (!isAutonomous) return null;
    return id === 'xbot' ? buildConciergeTour() : buildAutonomousActivities(id);
  }, [isAutonomous, id]);

  const finalScenario = isGuidedTour ? activeActionScenario : (isAutonomous ? autonomousScenario : EMPTY_SCENARIO);
  const loopScenario = isAutonomous && !isGuidedTour;

  const hasSkyDrop = id !== 'xbot' && isAutonomous;
  const spawnDelay = hasSkyDrop ? ((characterIndex ?? 0) * 1.0) : 0;

  const {
    update: updateAgent,
    setPosition: setAgentPosition,
    setRotation: setAgentRotation,
    hasPendingDynamicTask,
    reportAnimationPlayback,
    initialPos,
  } = useAgentController(
    renderId,
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
      if (isGuidedTour && activeActionKey) {
        useSceneStore.setState(s => ({
          extraStates: { ...s.extraStates, [activeActionKey]: false }
        }));
      }
    },
    spawnDelay,
    hasSkyDrop,
    'pistol-kneel-to-stand',
    agentEnabled
  );

  // Synchronisation initiale des coordonnées caméra/character actif dès le montage
  useLayoutEffect(() => {
    if (navigationEnabled && isActive && !isPreview && initialPos) {
      cameraState.characterX = initialPos.x;
      cameraState.characterZ = initialPos.z;
      cameraState.followYaw = initialPos.rotY;
    }
  }, [isActive, isPreview, initialPos, navigationEnabled]);

  // Nettoyage de la position enregistrée dans cameraState lors du démontage
  useEffect(() => {
    if (isPreview || !navigationEnabled) return;
    return () => {
      delete cameraState.positions[id];
      delete cameraState.headPositions[id];
    };
  }, [id, isPreview, navigationEnabled]);

  // Setup échelle, offsets hanches, physiques et matériaux
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const baseHeight = isLara
      ? 173.4
      : (id === 'hayley' || id === 'gloria' || id === 'valby'
        ? 168.0
        : (findCharacter(id)?.height || 181.0));

    const scaleFactor = (targetHeight / baseHeight) * 100.0;
    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

    scene.updateMatrixWorld(true);

    initPhysicsBones(parts);

    scene.traverse((c: any) => {
      if (c.isBone && c.userData.restScale) {
        c.scale.copy(c.userData.restScale);
      }
    });

    if (parts.bones.hips) {
      const parent = scene.parent || scene;
      const hipsWorld = new THREE.Vector3();
      parts.bones.hips.getWorldPosition(hipsWorld);
      const hipsLocal = parent.worldToLocal(hipsWorld);
      scene.position.x -= hipsLocal.x;
      scene.position.z -= hipsLocal.z;
    }

    // Auto-élévation au niveau du sol (Y = 0) pour les modèles ayant leurs pieds modélisés sous Y=0
    const hasFeetAtGround = id === 'hayley' || id === 'gloria' || id === 'valby' || id === 'nurse';
    if (!isLara && !hasFeetAtGround) {
      const localBox = glbLocalBBox(scene);
      if (localBox.min.y < -1.0) {
        scene.position.y -= localBox.min.y;
      }
    }

    if (isLara) {
      if (variant) {
        applyLaraVariantStyles(scene, variant);
      }
      if (laraRealisticTextures) {
        applyLaraRealisticTextures(scene, true);
      }
    } else {
      normalizeNonLaraCharacterMaterials(scene, id);
    }

    hairChainRef.current = isLara ? buildHairChain(parts.bones.nativeHairBones) : [];
    baseScenePosRef.current.copy(scene.position);
    if (navigationEnabled && !isPreview && !isGridPartner) setAgentProfile(renderId, measureHumanProfile(scene, targetHeight));
    return () => { if (navigationEnabled && !isPreview && !isGridPartner) removeAgentProfile(renderId); };
  }, [scene, parts, isLara, targetHeight, variant, id, renderId, isPreview, isGridPartner, navigationEnabled, laraRealisticTextures]);

  // Textures réalistes (peau et tissus mats) pour les Lara
  useEffect(() => {
    if (!scene || !isLara) return;
    applyLaraRealisticTextures(scene, laraRealisticTextures);
    invalidate();
  }, [scene, isLara, laraRealisticTextures, invalidate]);

  // Synchroniser les vêtements avant le premier rendu, même après chargement différé du GLB.
  useLayoutEffect(() => {
    if (!scene || !isLara) return;
    applyClothingAndAccessoriesVisibility(parts, {
      laraTop,
      laraBottom,
      laraShoes,
      showAccessories,
      laraPistols,
      animationEquipment: animationEquipmentRef.current,
      equipment
    });
    invalidate();
  }, [parts, scene, equipment, laraTop, laraBottom, laraShoes, showAccessories, laraPistols, invalidate, isLara]);

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

  // Événement signalant que le character est prêt
  useEffect(() => {
    if (isPreview || !navigationEnabled) return;
    const timeout = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('character-ready', { detail: { id } }));
    }, 0);
    return () => clearTimeout(timeout);
  }, [id, isPreview, navigationEnabled]);

  // Réinitialisation complète lors du basculement en mode Grille de personnages
  useEffect(() => {
    if (characterGrid) {
      currentAnimClip.current = null;
      if (navigationEnabled && !isPreview) duoSessionManager.leaveDuoZone(id);
      if (groupRef.current) groupRef.current.rotation.set(0, 0, 0);
      if (animOriginRef.current) {
        animOriginRef.current.position.set(0, 0, 0);
        animOriginRef.current.rotation.set(0, 0, 0);
      }
      scene.position.copy(baseScenePosRef.current);
      scene.rotation.set(0, 0, 0);
      scene.traverse((c: any) => {
        if (c.isBone) {
          if (c.userData.restPos) c.position.copy(c.userData.restPos);
          if (c.userData.restQuat) c.quaternion.copy(c.userData.restQuat);
          if (c.userData.restScale) c.scale.copy(c.userData.restScale);
        }
      });
      scene.updateMatrixWorld(true);
      if (mixerRef.current) mixerRef.current.stopAllAction();
      activeActionName.current = '';
    }
    invalidate();
  }, [characterGrid, scene, id, isPreview, navigationEnabled, invalidate]);

  // Synchronisation characterAnim en mode preview ou grille de personnages
  useEffect(() => {
    if (!isPreview && !characterGrid) return;
    if (!characterAnim || characterAnim === 'idle') {
      currentAnimClip.current = null;
      invalidate();
      return;
    }
    loadAndPlayClip(characterAnim);
  }, [characterAnim, isPreview, characterGrid, loadAndPlayClip, invalidate]);

  // Écouteurs de commandes utilisateur & UI (couleur, coupe, équipements, positions)
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
      if (e.detail?.key === `character-pos-${id}`) {
        if (isPreview || !navigationEnabled) return;
        if (Array.isArray(e.detail.value) && e.detail.value.length === 3) {
          setAgentPosition(e.detail.value[0], e.detail.value[1], e.detail.value[2]);
          invalidate();
        }
        return;
      }

      if (e.detail?.key === `character-rot-${id}`) {
        if (isPreview || !navigationEnabled) return;
        if (typeof e.detail.value === 'number') {
          setAgentRotation(e.detail.value);
          invalidate();
        }
        return;
      }

      handleToggleHairColor(e);
      handleToggleHaircut(e);
    };

    document.addEventListener('furniture-toggle', onToggle);
    return () => {
      document.removeEventListener('furniture-toggle', onToggle);
    };
  }, [isActive, id, invalidate, isPreview, navigationEnabled]);

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
      
      const visible = showNativeHair ? !(variant === 'angelina' && isBraid) : false;
      item.mesh.visible = visible;
      const mat = item.mesh.material;
      if (mat) {
        const mats = Array.isArray(mat) ? mat : [mat];
        mats.forEach(m => {
          if (!m) return;
          m.visible = visible;
          if (targetColor && 'color' in m) {
            (m as any).map = null;
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

    if (haircut === 'original') {
      const ghostWigs = headBone.children.filter((c: any) => !c.isBone && (c.userData.isWigRoot || c.name.toLowerCase().includes('hair') || c.name.includes('_ARM_')));
      ghostWigs.forEach((w: any) => {
        disposeOwnedWigResources(w);
        headBone.remove(w);
      });
    }

    const existingAttachment = headBone.getObjectByName('lara_custom_hair_attachment');
    if (existingAttachment) {
      headBone.remove(existingAttachment);
    }

    if (groupRef.current) {
      updateCharacterLayers(groupRef.current, isActive && cameraState.isFirstPersonView());
    }

    invalidate();
  }, [scene, parts, haircut, hairColor, variant, isActive, invalidate]);

  // Boucle frame principale : positionnement, mix d'animations & physiques
  const frameControl = useRef({ agentAnimationPaused: false, isUserManuallyMoving: false, hasDynamicTask: false, distance: 0 });
  useCharacterFrame(renderId, { simulate: (_state, delta) => {
    if (!groupRef.current || !mixerRef.current) return;
    const oldX = groupRef.current.position.x, oldZ = groupRef.current.position.z;
    const wasVisible = groupRef.current.visible;

    const hasDynamicTask = agentEnabled && hasPendingDynamicTask();
    let agentAnimationPaused = false;
    const hasCharacterControl = cameraState.isXR || (!cameraState.animalTarget && (
      cameraState.mode === 'fpv' || useSceneStore.getState().arrowControl === 'character'
    ));
    const isUserManuallyMoving = hasCharacterControl && cameraState.isUserControlling();

    if (!navigationEnabled && !isPreview) {
      const pose = cameraState.positions[id];
      groupRef.current.visible = !!pose && !cameraState.characterHidden;
      if (pose) {
        groupRef.current.position.set(pose.x, pose.y, pose.z);
        groupRef.current.rotation.y = pose.yaw;
        currentAnimClip.current = pose.anim ?? null;
      }
    } else if (isPreview) {
      if (previewPosition) {
        groupRef.current.position.set(previewPosition[0], previewPosition[1], previewPosition[2]);
      } else {
        groupRef.current.position.set(0, 0, 0);
      }
      if (previewRotationY !== undefined) {
        groupRef.current.rotation.y = previewRotationY;
      } else {
        groupRef.current.rotation.y = 0;
      }
      groupRef.current.visible = true;
    } else if (characterGrid) {
      const { x: targetX, y: targetY, z: targetZ } = getCharacterGridPosition(characterIndex, totalCharacters);
      groupRef.current.position.set(targetX, targetY, targetZ);
      groupRef.current.rotation.y = 0;
      const isVisibleInCountMode = isCharacterVisibleInMode(id, laraCount, activeCharacterId, extraCharacters, activeExtraIds, activeMainIds);
      groupRef.current.visible = !cameraState.characterHidden && showAllLaraStyles && isVisibleInCountMode;
      currentAnimClip.current = characterAnim || null;
      if (isVisibleInCountMode && !cameraState.characterHidden && showAllLaraStyles) {
        cameraState.positions[id] = { x: targetX, y: targetY, z: targetZ, yaw: 0 };
        if (isActive) {
          cameraState.characterX = targetX;
          cameraState.characterZ = targetZ;
        }
      } else {
        delete cameraState.positions[id];
      }
    } else {
      if (isActive) {
        if (hasDynamicTask || isGuidedTour || (!isUserManuallyMoving && isAutonomous)) {
          const agentState = updateAgent(delta);
          agentAnimationPaused = agentState.animationPaused ?? false;

          groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
          groupRef.current.rotation.y = agentState.rotY;
          currentAnimClip.current = agentState.animation;
          groupRef.current.visible = !cameraState.characterHidden && agentState.isSpawned;

          cameraState.characterX = agentState.x;
          cameraState.characterZ = agentState.z;
          cameraState.followYaw = agentState.rotY;
          cameraState.isAIControlled = true;
          if (agentState.isSpawned) {
            cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY, anim: agentState.animation };
          } else {
            delete cameraState.positions[id];
          }
        } else {
          groupRef.current.position.set(cameraState.characterX, 0, cameraState.characterZ);
          groupRef.current.rotation.y = cameraState.followYaw;
          groupRef.current.visible = !cameraState.characterHidden;
          cameraState.isAIControlled = false;
          currentAnimClip.current = null;
          cameraState.positions[id] = { x: cameraState.characterX, y: 0, z: cameraState.characterZ, yaw: cameraState.followYaw, anim: (cameraState.isMoving ? 'walk' : 'idle') };
          
          setAgentPosition(cameraState.characterX, 0, cameraState.characterZ);
          setAgentRotation(cameraState.followYaw);
        }
      } else if (isNPC) {
        const agentState = updateAgent(delta);
        agentAnimationPaused = agentState.animationPaused ?? false;

        groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
        groupRef.current.rotation.y = agentState.rotY;
        currentAnimClip.current = agentState.animation;
        const isVisibleInCountMode = isCharacterVisibleInMode(id, laraCount, activeCharacterId, extraCharacters, activeExtraIds, activeMainIds);
        groupRef.current.visible = !cameraState.characterHidden && showAllLaraStyles && isVisibleInCountMode && agentState.isSpawned;

        if (agentState.isSpawned && isVisibleInCountMode) {
          cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY, anim: agentState.animation };
        } else {
          delete cameraState.positions[id];
        }
      } else {
        groupRef.current.visible = false;
      }

      const isFirstPerson = isActive && cameraState.isFirstPersonView();
      if (prevFirstPersonRef.current !== isFirstPerson) {
        if (groupRef.current) {
          updateCharacterLayers(groupRef.current, isFirstPerson);
        }
        prevFirstPersonRef.current = isFirstPerson;
      }
    }

    frameControl.current.agentAnimationPaused = agentAnimationPaused;
    frameControl.current.distance = wasVisible && groupRef.current.visible
      ? Math.hypot(groupRef.current.position.x - oldX, groupRef.current.position.z - oldZ) : 0;
    frameControl.current.isUserManuallyMoving = isUserManuallyMoving;
    frameControl.current.hasDynamicTask = hasDynamicTask;
  }, animate: (state, delta) => {
    if (!groupRef.current || !mixerRef.current) return;
    const { agentAnimationPaused, isUserManuallyMoving, hasDynamicTask } = frameControl.current;
    if (!groupRef.current.visible) {
      if (navigationEnabled && !isPreview) delete cameraState.headPositions[id];
      return;
    }

    // Effet dynamique LGBT+
    if (variant === 'lgbta' && parts.lgbtaHairMaterials.length > 0) {
      const cycle = 15;
      const t = state.clock.elapsedTime % cycle;
      let hue = 0.86;
      if (t > 10) {
        hue = (0.86 + (t - 10) / 5) % 1.0;
      }
      _tmpLgbtaColorA.setHSL(hue, 1.0, 0.5);
      _tmpLgbtaColorB.setHSL(hue, 1.0, 0.15);
      for (let i = 0; i < parts.lgbtaHairMaterials.length; i++) {
        const m = parts.lgbtaHairMaterials[i] as any;
        if (m.color) m.color.copy(_tmpLgbtaColorA);
        if (m.emissive) m.emissive.copy(_tmpLgbtaColorB);
      }
    }

    const mixer = mixerRef.current;
    const actions = actionsRef.current;

    const isMoving = !isPreview && !characterGrid && isActive && (cameraState.isXR || isUserManuallyMoving) && cameraState.isMoving;
    const rawTarget = (isPreview || characterGrid)
      ? (characterAnim || 'idle')
      : (currentAnimClip.current || (isMoving ? 'walk' : 'idle'));

    if (navigationEnabled && isActive && !characterGrid && !isGuidedTour && !hasDynamicTask && (cameraState.isXR || isUserManuallyMoving) && currentAnimClip.current) {
      currentAnimClip.current = null;
    }

    let target = resolveAnimationId(rawTarget);

    const isTPose = target === 't-pose';

    let isTemporaryLoadingFallback = false;
    if (!isTPose && !actions[target]) {
      loadAndPlayClip(target);
      const idleId = resolveAnimationId('idle');
      if (activeActionName.current && actions[activeActionName.current]) {
        const prevIsLocomotion = activeActionName.current.includes('walk') || activeActionName.current.includes('run');
        target = (prevIsLocomotion && actions[idleId]) ? idleId : activeActionName.current;
      } else if (actions[idleId]) {
        target = idleId;
      }
      isTemporaryLoadingFallback = true;
    }

    const postureTransition = !isPreview && !characterGrid && isPostureTransition(target);
    const idleId = resolveAnimationId('idle');
    if (postureTransition && !actions[idleId]) {
      loadAndPlayClip(idleId);
      return;
    }
    // A pending clip must not move the origin of the pose still on screen.
    if (animOriginRef.current && !postureTransition && !isTemporaryLoadingFallback) {
      const { offset, rotY } = getAnimationOriginTransform(target);
      const factor = isPreview || characterGrid || !animOriginLerp ? 1 : Math.min(1, delta * 8);
      animOriginRef.current.position.lerp(_tmpAnimOrigin.set(...offset), factor);
      animOriginRef.current.rotation.y = THREE.MathUtils.lerp(animOriginRef.current.rotation.y, rotY, factor);
    }

    const animationEquipment = isTPose ? undefined : getAnimationDef(target)?.equipment;
    if (isLara && animationEquipmentRef.current !== animationEquipment) {
      animationEquipmentRef.current = animationEquipment;
      applyPistolVisibility(parts, { showAccessories, laraPistols, equipment, animationEquipment });
    }

    if (isTPose) {
      if (activeActionName.current !== 't-pose') {
        if (activeActionName.current && actions[activeActionName.current]) {
          actions[activeActionName.current].stop();
        }
        mixer.stopAllAction();
        activeActionName.current = 't-pose';
      }
      scene.traverse((c: any) => {
        if (c.isBone) {
          if (c.userData.restPos) c.position.copy(c.userData.restPos);
          if (c.userData.restQuat) c.quaternion.copy(c.userData.restQuat);
          if (c.userData.restScale) c.scale.copy(c.userData.restScale);
        }
      });
      scene.updateMatrixWorld(true);
    } else {
      let to = actions[target];
      if (to && activeActionName.current !== target) {
        if (postureTransition) {
          if (!hipsBone) throw new Error(`Missing pelvis for ${renderId}`);
          const previous = postureClipsRef.current.get(target);
          const original = previous?.original ?? to.getClip();
          if (previous) mixer.uncacheAction(previous.fitted);
          const fitted = fitPostureTransition(original, hipsBone, actions[idleId].getClip());
          postureClipsRef.current.set(target, { original, fitted });
          const originalAction = to;
          to = mixer.clipAction(fitted);
          for (const key in actions) if (actions[key] === originalAction) actions[key] = to;
          mixer.uncacheAction(originalAction.getClip());
          const rotDelta = getPostureTransitionRotDelta(activeActionName.current, target);
          postureOriginRef.current.position.copy(animOriginRef.current.position);
          postureOriginRef.current.rotY = animOriginRef.current.rotation.y + rotDelta;
          animOriginRef.current.rotation.y = postureOriginRef.current.rotY;
        }
        const from = (activeActionName.current && activeActionName.current !== 't-pose') ? actions[activeActionName.current] : null;
        const blendDuration = getCrossfadeDuration(activeActionName.current, target);
        if (from) retireAction(from, characterGrid || !animCrossfade ? 0 : (isPreview ? Math.min(blendDuration, 0.15) : blendDuration));

        const isOnceAnim = getAnimationDef(target)?.loop === 'once' ||
                           target === 'pistol-kneel-to-stand' ||
                           target === 'anim-pistol-kneel-to-stand' ||
                           target === 'sit-to-stand' ||
                           target === 'anim-sit-to-stand' ||
                           target === 'crouch-to-stand' ||
                           target === 'stand-up' ||
                           target === 'stand-up-1' ||
                           target === 'get-up-bed' ||
                           target === 'standing-up' ||
                           target === 'standing-up-from-bed' ||
                           target === 'getting-up' ||
                           target === 'getting-up-from-backside' ||
                           target === 'kip-up' ||
                           target.includes('to-stand') ||
                           target.includes('landing');
        if (isOnceAnim) {
          to.setLoop(THREE.LoopOnce, 1);
          to.clampWhenFinished = true;
        } else {
          to.setLoop(THREE.LoopRepeat, Infinity);
          to.clampWhenFinished = false;
        }

        if (characterGrid) {
          if (from) from.stop();
          to.reset().play();
          to.setEffectiveWeight(1);
        } else {
          if (from) {
            to.reset();
            to.setEffectiveTimeScale(1);
            to.setEffectiveWeight(1);
            if (animCrossfade) {
              const crossDuration = isPreview ? Math.min(blendDuration, 0.15) : blendDuration;
              to.crossFadeFrom(from, crossDuration, !postureTransition && !isPostureTransition(activeActionName.current));
            } else {
              from.stop();
            }
            to.play();
          } else {
            to.reset().fadeIn(animCrossfade ? (isPreview ? 0.1 : blendDuration) : 0).play();
            to.setEffectiveWeight(1);
          }
        }
        activeActionName.current = target;

        const isControlledByStore = isPreview || characterGrid;
        if (isPreview) {
          // A replacement preview character joins the shared playback clock.
          to.time = useAnimPreviewStore.getState().currentTime;
        } else if (isControlledByStore) {
          const store = useAnimPreviewStore.getState();
          if (store.isPlaying && !store.isScrubbing) {
            store.setCurrentTime(0);
          }
        }

        if (isActive && !isPreview && !characterGrid && !isTemporaryLoadingFallback && lastLoggedAnimRef.current !== target) {
          lastLoggedAnimRef.current = target;
          const isWalkAnim = target === 'walk' || target.includes('/locomotion/') || target.includes('walk') || target.includes('run');
          if (!isWalkAnim) {
            const animDef = getAnimationDef(target);
            const cleanName = animDef?.label || target.split('/').pop()?.replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ') || target;
            const emoji = (target === resolveAnimationId('idle') || target === 'idle') ? '🧘' : '💃';
            appLog(id, `${emoji} Animation : ${cleanName}`, {
              category: 'anim',
              action: 'anim_play',
              actors: [id],
              animation: {
                id: animDef?.id ?? target,
                mode: 'solo',
                label: cleanName,
                actorId: id,
              },
            });
          }
        }
      }
    }

    const isVisibleInFrustum = !state.camera || (() => {
      updateCharFrustum(state.camera, state.clock.elapsedTime);
      _charBoundingSphere.center.copy(groupRef.current.position);
      _charBoundingSphere.center.y += 90;
      _charBoundingSphere.radius = 120;
      return _charFrustum.intersectsSphere(_charBoundingSphere);
    })();

    const isControlledByStore = isPreview || characterGrid;

    let pendantDelta = 0;
    let resetPendant = isTPose;
    if (isControlledByStore) {
      actions[activeActionName.current]?.setEffectiveTimeScale(1);
      const store = useAnimPreviewStore.getState();
      const animDelta = delta * (store.speed || 1);
      pendantDelta = store.isPlaying && !store.isScrubbing && !isTPose ? delta * store.speed : 0;
      resetPendant ||= store.isScrubbing;

      if (isTPose) {
        if (isActive || characterIndex === 0) {
          store.setClipInfo('T-Pose', 0, true);
        }
      } else if (isDuoRoleB) {
        // En mode Duo, le Rôle B suit STRICTEMENT l'horloge partagée pilotée par le Rôle A
        if (activeActionName.current && actions[activeActionName.current]) {
          const actB = actions[activeActionName.current];
          const clipB = actB.getClip();
          if (clipB && clipB.duration > 0) {
            actB.setEffectiveWeight(1);
            const targetTimeB = store.isLooping ? store.currentTime % clipB.duration : Math.min(store.currentTime, clipB.duration);
            actB.setLoop(store.isLooping ? THREE.LoopRepeat : THREE.LoopOnce, store.isLooping ? Infinity : 0);
            actB.clampWhenFinished = !store.isLooping;
            actB.paused = false;
            mixer.setTime(targetTimeB);
            actB.time = targetTimeB;
            actB.paused = !store.isPlaying || store.isScrubbing;
          }
        }
      } else if (activeActionName.current && actions[activeActionName.current]) {
        const act = actions[activeActionName.current];
        const clip = act.getClip();
        if (clip && clip.duration > 0) {
          const hasActivePreview = typeof document !== 'undefined' && Boolean(document.querySelector('.inventory-preview-container'));
          const isMaster = !hasActivePreview || isPreview
            ? (isAnimationMaster ?? (isPreview || isActive || characterIndex === 0))
            : false;
          if (isMaster && !isTemporaryLoadingFallback) {
            const cleanName = duoAnimDef
              ? duoAnimDef.label
              : (activeActionName.current.split('/').pop()?.replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ') || activeActionName.current);
            store.setClipInfo(cleanName, clip.duration, false);
          }

          const targetTime = store.isLooping ? store.currentTime % clip.duration : Math.min(store.currentTime, clip.duration);

          if (store.isPlaying && !store.isScrubbing) {
            if (act.paused) {
              act.paused = false;
              act.time = targetTime;
            }

            // Détection d'un saut de temps externe (ex: seekToFrame(0), retour au début pendant la lecture)
            if (Math.abs(act.time - targetTime) > 0.05) {
              resetPendant = true;
              act.time = targetTime;
            }

            if (!store.isLooping) {
              act.setLoop(THREE.LoopOnce, 0);
              act.clampWhenFinished = true;
            } else {
              act.setLoop(THREE.LoopRepeat, Infinity);
              act.clampWhenFinished = false;
            }

            if (isMaster && !isTemporaryLoadingFallback) {
              if (store.activeSegments.length > 0) {
                // Quand des coupes sont actives, le store avance son temps via tick(delta) (qui saute automatiquement les trous)
                const newTime = store.tick(delta);
                act.time = newTime;
                mixer.setTime(newTime);
              } else {
                const mixerStarted = performance.now();
                mixer.update(animDelta);
                recordMixer(performance.now() - mixerStarted);
                if (!store.isLooping && act.time >= clip.duration) {
                  act.time = clip.duration;
                  act.paused = true;
                  store.setCurrentTime(clip.duration);
                  store.pause();
                } else {
                  store.setCurrentTime(act.time % clip.duration);
                }
              }
            } else {
              mixer.setTime(targetTime);
              // Dans CharacterGrid, synchronisation avec le master
              if (Math.abs(act.time - targetTime) > 0.05) {
                act.time = targetTime;
              }
            }
          } else {
            act.setEffectiveWeight(1);
            act.paused = false;
            mixer.setTime(targetTime);
            act.time = targetTime;
            act.paused = true;
          }
        }
      }

      // Verrouillage optionnel des hanches sur place (Hips-Lock X/Z) pour tester/comparer
      if (store.lockHipsXZ && parts.bones.hips) {
        parts.bones.hips.position.x = 0;
        parts.bones.hips.position.z = 0;
      }

      if (isVisibleInFrustum) {
        updatePhysics(animDelta, {
          haircut,
          isMoving,
          targetAnim: target,
          characterAnim,
          clockElapsedTime: store.currentTime
        }, scene);
      }
    } else if (!isPaused && !isTPose) {
      pendantDelta = delta;
      if (activeActionName.current && actions[activeActionName.current]) {
        const act = actions[activeActionName.current];
        if (act.paused && !(act.loop === THREE.LoopOnce && act.time >= act.getClip().duration)) act.paused = false;
      }
      if (duoSessionManager.isPlaying(id)) {
        const partA = duoSessionManager.getParticipantA(id);
        const partB = duoSessionManager.getParticipantB(id);
        if (partA?.characterId === id || partB?.characterId === id) {
          const currentAnimState = duoSessionManager.getCurrentAnimState(id);
          if (
            currentAnimState &&
            activeActionName.current &&
            (
              currentAnimState.clipA === activeActionName.current ||
              currentAnimState.clipB === activeActionName.current ||
              resolveAnimationId(currentAnimState.clipA) === activeActionName.current ||
              resolveAnimationId(currentAnimState.clipB) === activeActionName.current
            )
          ) {
            const act = actions[activeActionName.current];
            if (act) {
              const clipDur = act.getClip().duration;
              if (clipDur > 0) {
                const elapsed = duoSessionManager.getElapsedTimeInRepeat(id);
                act.time = elapsed % clipDur;
              }
            }
          }
        }
      }
      const mixerStarted = performance.now();
      const walkingAction = actions[activeActionName.current];
      if (walkingAction) {
        const speed = getWalkCycleSpeed(walkingAction.getClip(), scene);
        if (speed !== null) walkingAction.setEffectiveTimeScale(walkTimeScale(frameControl.current.distance, delta, speed));
      }
      mixer.update(agentAnimationPaused ? 0 : delta);
      recordMixer(performance.now() - mixerStarted);

      // Parachute d'atterrissage réactif
      const falling = currentAnimClip.current === 'falling' ||
                      currentAnimClip.current === 'falling-idle' ||
                      currentAnimClip.current === 'animations/mixamo/anim_falling.glb' ||
                      currentAnimClip.current === 'animations/mixamo/anim_falling_idle.glb';
      if (isFalling !== falling) {
        setIsFalling(falling);
      }

      if (isVisibleInFrustum) {
        updatePhysics(delta, {
          haircut,
          isMoving,
          targetAnim: target,
          characterAnim,
          clockElapsedTime: state.clock.elapsedTime
        }, scene);
      }
    }

    if (navigationEnabled && !isPreview && !characterGrid && activeActionName.current) {
      const action = actions[activeActionName.current];
      if (action) {
        const duration = action.getClip().duration;
        const progress = duration > 0 ? Math.min(1, action.time / duration) : 1;
        reportAnimationPlayback(activeActionName.current, progress, action.loop === THREE.LoopOnce && action.time >= duration);
        if (postureTransition && animOriginRef.current) {
          const idleOrigin = getAnimationOriginTransform(idleId);
          animOriginRef.current.position.copy(postureOriginRef.current.position)
            .lerp(_tmpAnimOrigin.set(...idleOrigin.offset), progress);
          animOriginRef.current.rotation.y = THREE.MathUtils.lerp(postureOriginRef.current.rotY, idleOrigin.rotY, progress);
        }
      }
    }

    collectActions();
    pendantRef.current?.update(pendantDelta, resetPendant);
    parachuteRef.current?.update(delta);

    // Position XZ réelle de la tête (minimap) — actif ET PNJ. Sans os de tête : non publié → non dessiné
    if (navigationEnabled && !isPreview) {
      if (headRefBone) {
        // Actif : matrice à jour ; PNJ : matrixWorld du dernier rendu (1 frame de retard, sans coût de remontée de hiérarchie)
        if (isActive) headRefBone.updateWorldMatrix(true, false);
        _tmpHeadRefPos.setFromMatrixPosition(headRefBone.matrixWorld);
        const hp = cameraState.headPositions[id] ?? (cameraState.headPositions[id] = { x: 0, z: 0 });
        hp.x = _tmpHeadRefPos.x;
        hp.z = _tmpHeadRefPos.z;
      } else {
        delete cameraState.headPositions[id];
      }
    }

    // Suivi dynamique de la tête, du torse et des yeux (3ème personne et FPV réaliste)
    if (navigationEnabled && isActive && !isPreview) {
      if (headBone) {
        if (headBone.scale.x < 0.5) {
          headBone.scale.set(1, 1, 1);
        }
        headBone.updateWorldMatrix(true, false);
        headBone.getWorldPosition(_tmpHeadWorldPos);
        if (!cameraState.activeHeadPos) {
          cameraState.activeHeadPos = { x: _tmpHeadWorldPos.x, y: _tmpHeadWorldPos.y, z: _tmpHeadWorldPos.z };
        } else {
          cameraState.activeHeadPos.x = _tmpHeadWorldPos.x;
          cameraState.activeHeadPos.y = _tmpHeadWorldPos.y;
          cameraState.activeHeadPos.z = _tmpHeadWorldPos.z;
        }

        // Direction du regard (forward Z) et axe haut (up Y) de la tête
        _tmpHeadForward.set(0, 0, 1).transformDirection(headBone.matrixWorld);
        _tmpHeadUp.set(0, 1, 0).transformDirection(headBone.matrixWorld);

        if (!cameraState.activeHeadForward) {
          cameraState.activeHeadForward = { x: _tmpHeadForward.x, y: _tmpHeadForward.y, z: _tmpHeadForward.z };
        } else {
          cameraState.activeHeadForward.x = _tmpHeadForward.x;
          cameraState.activeHeadForward.y = _tmpHeadForward.y;
          cameraState.activeHeadForward.z = _tmpHeadForward.z;
        }

        if (!cameraState.activeHeadUp) {
          cameraState.activeHeadUp = { x: _tmpHeadUp.x, y: _tmpHeadUp.y, z: _tmpHeadUp.z };
        } else {
          cameraState.activeHeadUp.x = _tmpHeadUp.x;
          cameraState.activeHeadUp.y = _tmpHeadUp.y;
          cameraState.activeHeadUp.z = _tmpHeadUp.z;
        }

        // Calcul précis du milieu des deux yeux
        if (leftEyeBone && rightEyeBone) {
          leftEyeBone.updateWorldMatrix(true, false);
          rightEyeBone.updateWorldMatrix(true, false);
          leftEyeBone.getWorldPosition(_tmpLeftEyeWorldPos);
          rightEyeBone.getWorldPosition(_tmpRightEyeWorldPos);
          _tmpEyesWorldPos.addVectors(_tmpLeftEyeWorldPos, _tmpRightEyeWorldPos).multiplyScalar(0.5);
        } else {
          // Fallback pour modèles sans os oculaires dédiés : décalage anatomique depuis la tête
          const isMannequin = id === 'mannequin';
          const upOffset = isMannequin ? 11.2 : 10.16;
          const forwardOffset = isMannequin ? 16.5 : (!isLara ? 14.0 : 7.04);
          _tmpEyesWorldPos.copy(_tmpHeadWorldPos)
            .addScaledVector(_tmpHeadUp, upOffset)
            .addScaledVector(_tmpHeadForward, forwardOffset);
        }

        if (!cameraState.activeEyesPos) {
          cameraState.activeEyesPos = { x: _tmpEyesWorldPos.x, y: _tmpEyesWorldPos.y, z: _tmpEyesWorldPos.z };
        } else {
          cameraState.activeEyesPos.x = _tmpEyesWorldPos.x;
          cameraState.activeEyesPos.y = _tmpEyesWorldPos.y;
          cameraState.activeEyesPos.z = _tmpEyesWorldPos.z;
        }
      }
      if (hipsBone) {
        hipsBone.updateWorldMatrix(true, false);
        hipsBone.getWorldPosition(_tmpHipsWorldPos);
        if (!cameraState.activeHipsPos) {
          cameraState.activeHipsPos = { x: _tmpHipsWorldPos.x, y: _tmpHipsWorldPos.y, z: _tmpHipsWorldPos.z };
        } else {
          cameraState.activeHipsPos.x = _tmpHipsWorldPos.x;
          cameraState.activeHipsPos.y = _tmpHipsWorldPos.y;
          cameraState.activeHipsPos.z = _tmpHipsWorldPos.z;
        }
      }
    }
  }});

  return (
    <group
      ref={groupRef}
      visible={false}
      position={[initialPos?.x ?? 0, hasSkyDrop ? 2500 : (initialPos?.y ?? 0), initialPos?.z ?? 0]}
      rotation={[0, initialPos?.rotY ?? 0, 0]}
      name={charLabel}
      userData={{
        name: charLabel,
        itemName: charLabel,
        animUnit: true,
        noAnim: true,
      }}
    >
      {/* Proxy de sélection léger pour le HoverMenu sans raycasting complexe sur maillages skinned */}
      {!isActive && !isPreview && (
        <mesh
          position={[0, (targetHeight || 175) / 2, 0]}
          userData={{
            isHoverProxy: true,
            hoverAction: {
              label: charLabel,
              actions: [`select-character-${id}`],
            },
          }}
        >
          <cylinderGeometry args={[25, 25, targetHeight || 175, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <group ref={animOriginRef}>
        <primitive ref={modelRef} object={scene} />
      </group>

      {isLara && id !== 'romana' && variant !== 'romana' && <CharacterPendant
        ref={pendantRef}
        variant={variant}
        neck={parts.bones.neck}
        scene={scene}
        torso={[...parts.torsoClothed, ...parts.torsoNude].map(part => part.mesh)}
        visible={showAccessories}
        shadows={characterShadows}
        resetKey={`${isPreview}:${characterGrid}`}
      />}

      {headBone && (variant === 'vivida' || id === 'vivida') && (
        <CharacterBaseballCap attachTo={headBone} />
      )}

      {headBone && id !== 'native' && variant !== 'native' && haircut !== 'original' && (
        <Wig
          id={haircut.replace('hair_', '')}
          color={hairColor}
          onBonesExtracted={(bones) => {
            customHairChainRef.current = buildHairChain(bones.map(b => b.bone));
          }}
          attachTo={headBone}
        />
      )}
      {!isPreview && <HeartParachute
        ref={parachuteRef}
        visible={isFalling}
        attachTo={parts.bones.spine2 ?? parts.bones.spine ?? parts.bones.hips}
        paused={isPaused}
      />}
      <GroundPoint
        color={(isPreview ? !isDuoRoleB : isActive) ? '#0058a3' : '#ff2222'}
        hipsBone={parts.bones.hips}
      />
    </group>
  );
}
