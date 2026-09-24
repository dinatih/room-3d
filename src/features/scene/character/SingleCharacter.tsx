/**
 * SingleCharacter.tsx — Personnages (Walkers & NPCs).
 * Version modulaire intégrant animations, physique Verlet, styles/accessoires et agent IA.
 */
import { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { Wig, HAIR_COLORS, disposeOwnedWigResources } from '../items/Wig';
import { CharacterBaseballCap } from './CharacterBaseballCap';
import { applyLaraVariantStyles, disposeLaraVariantMaterials, applyLaraRealisticTextures } from '../LaraVariants';
import { isCharacterVisibleInMode, AUTONOMOUS_NPC_IDS, isExtraCharacter, findCharacter } from '../walkerConfig';
import { disposeCharacterResources } from './characterDisposal';
import { clearCharacterRetargetCache } from './useCharacterAnimations';
import { buildHairChain } from '../retargeting/index';
import { glbLocalBBox } from '@features/scene/glbUtils';
import {
  extractCharacterParts,
  applyClothingAndAccessoriesVisibility,
  applyRenderProperties,
  normalizeNonLaraCharacterMaterials,
} from '../characterParts';
import { ACTION_FULL_TOUR, buildAutonomousScenario } from '../ai/scenarios';
import type { AgentInstruction } from '../ai/aiTypes';
import { useAgentController } from '../ai/useAgentController';
import { duoSessionManager } from '../ai/duoSessionManager';
import { appLog } from '@features/ui/AppConsole';
import { resolveAnimationId, getAnimationDef } from '../animations/animationResolver';
import { APP_IDLE_TIMEOUT_SECONDS, isAppIdle } from '../idleState';
import { CharacterThoughtBubble } from '../CharacterThoughtBubble';

import type { SingleCharacterProps } from './characterTypes';
import { updateCharacterLayers } from './characterLayers';
import { GroundPoint } from './GroundPoint';
import { HeartParachute } from './HeartParachute';
import { useCharacterAnimations } from './useCharacterAnimations';
import { useCharacterPhysics } from './useCharacterPhysics';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import { getLaraGridPosition } from './laraGridUtils';

const EMPTY_SCENARIO: AgentInstruction[] = [];
const _tmpLgbtaColorA = new THREE.Color();
const _tmpLgbtaColorB = new THREE.Color();
const _charFrustum = new THREE.Frustum();
const _charProjScreenMatrix = new THREE.Matrix4();
const _charBoundingSphere = new THREE.Sphere();
const _tmpHeadWorldPos = new THREE.Vector3();
const _tmpHipsWorldPos = new THREE.Vector3();
const _tmpLeftEyeWorldPos = new THREE.Vector3();
const _tmpRightEyeWorldPos = new THREE.Vector3();
const _tmpEyesWorldPos = new THREE.Vector3();
const _tmpHeadForward = new THREE.Vector3();
const _tmpHeadUp = new THREE.Vector3();

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

export function SingleCharacter({
  id,
  name,
  modelPath,
  isLara,
  targetHeight,
  isActive,
  isPreview = false,
  characterIndex = 0,
  totalCharacters = 1,
  walkerAnim = 'idle',
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
}: SingleCharacterProps) {
  const [localHaircut, setLocalHaircut] = useState<string>('original');
  const haircut = isPreview && previewHaircut ? previewHaircut : localHaircut;

  const [localHairColor, setLocalHairColor] = useState<string | undefined>(undefined);
  const hairColor = isPreview ? previewHairColor : localHairColor;

  const laraGrid = useSceneStore(state => state.layers.laraGrid);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const laraCount = useSceneStore(state => state.layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15));
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const showWallhack = useSceneStore(state => state.layers.wallhack);
  const showAccessories = useSceneStore(state => state.layers.accessories ?? true);
  const laraPistols = useSceneStore(state => state.layers.laraPistols ?? true);
  const laraNude = useSceneStore(state => state.layers.laraNude ?? false);
  const laraTopOff = useSceneStore(state => state.layers.laraTopOff ?? false);
  const laraBottomOff = useSceneStore(state => state.layers.laraBottomOff ?? false);
  const laraShoes = useSceneStore(state => state.layers.laraShoes ?? true);
  const laraRealisticTextures = useSceneStore(state => state.layers.laraRealisticTextures ?? false);
  const characterShadows = useSceneStore(state => state.layers.characterShadows ?? true);
  const characterWireframe = useSceneStore(state => state.layers.characterWireframe ?? false);
  const showThoughtBubble = useSceneStore(state => state.layers.thoughtBubble ?? true);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const aiFullTour = useSceneStore(state => state.extraStates.aiFullTour);

  const { scene } = useGLTFClone(modelPath);
  const charLabel = name || (isNPC ? `PNJ (${id})` : `Personnage (${id})`);

  useLayoutEffect(() => {
    if (!scene) return;
    const hoverData = isPreview || isActive ? undefined : {
      label: charLabel,
      actions: [`select-walker-${id}`]
    };
    scene.name = charLabel;
    scene.userData = {
      ...scene.userData,
      name: charLabel,
      itemName: charLabel,
      hoverAction: hoverData,
    };
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData = {
          ...child.userData,
          itemName: charLabel,
          hoverAction: hoverData,
        };
        child.frustumCulled = false;
      }
    });
  }, [scene, charLabel, isPreview, isActive, id]);

  // Libération propre des ressources GPU (textures, matériaux, géométries), cache GLTF et retargeting au démontage
  useEffect(() => {
    return () => {
      disposeLaraVariantMaterials(scene);
      clearCharacterRetargetCache(id);
      if (isExtraCharacter(id)) {
        disposeCharacterResources(scene);
        useGLTF.clear(modelPath);
      }
    };
  }, [id, modelPath, scene]);

  // Extraction structurée des maillages et des os
  const parts = useMemo(() => extractCharacterParts(scene), [scene]);
  const headBone = parts.bones.head;
  const hipsBone = parts.bones.hips;
  const leftEyeBone = useMemo(() => (scene ? (scene.getObjectByName('head_eyeball_left') as THREE.Bone | null) : null), [scene]);
  const rightEyeBone = useMemo(() => (scene ? (scene.getObjectByName('head_eyeball_right') as THREE.Bone | null) : null), [scene]);

  // Nettoyage de la référence de tête et d'yeux caméra quand le personnage n'est plus actif
  useEffect(() => {
    return () => {
      if (isActive) {
        cameraState.activeHeadPos = null;
        cameraState.activeHipsPos = null;
        cameraState.activeEyesPos = null;
        cameraState.activeHeadForward = null;
        cameraState.activeHeadUp = null;
      }
    };
  }, [isActive]);

  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const baseScenePosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const prevFirstPersonRef = useRef<boolean | null>(null);
  const hasLoggedIdleRef = useRef<boolean>(false);
  const lastLoggedAnimRef = useRef<string>('');
  const [isFalling, setIsFalling] = useState<boolean>(false);

  const [equipment, setEquipment] = useState<{ holster: boolean; pistols: boolean; backpack: boolean }>({
    holster: true,
    pistols: true,
    backpack: true,
  });

  const { invalidate } = useThree();

  // Sous-systèmes Animations & Physique
  const {
    mixerRef,
    actionsRef,
    activeActionName,
    currentAnimClip,
    userAnimOverrideRef,
    loadAndPlayClip
  } = useCharacterAnimations({
    id,
    scene,
    invalidate
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
      const isFirstPerson = isActive && (cameraMode === 'fpv' || cameraState.mode === 'fpv' || cameraState.isXR);
      updateCharacterLayers(groupRef.current, isFirstPerson);
      prevFirstPersonRef.current = isFirstPerson;
    }
  }, [cameraMode, isActive]);

  // Gestion des scénarios IA
  const activeActionKey = useMemo(() => {
    if (aiFullTour) return 'aiFullTour';
    return null;
  }, [aiFullTour]);

  const activeActionScenario = useMemo(() => {
    if (activeActionKey === 'aiFullTour') return ACTION_FULL_TOUR;
    return null;
  }, [activeActionKey]);

  const isAutonomous = !isPreview && AUTONOMOUS_NPC_IDS.has(id);
  const isGuidedTour = !isPreview && Boolean(activeActionKey && id === activeWalkerId);

  const autonomousScenario = useMemo(() => {
    if (!isAutonomous) return null;
    return buildAutonomousScenario(id);
  }, [isAutonomous, id]);

  const finalScenario = isGuidedTour ? activeActionScenario : (isAutonomous ? autonomousScenario : EMPTY_SCENARIO);
  const loopScenario = isAutonomous;

  const isExcepted = id === 'xbot' || isExtraCharacter(id);
  const hasSkyDrop = !isExcepted && isAutonomous;
  const spawnDelay = hasSkyDrop ? ((characterIndex ?? 0) * 1.0) : 0;

  const {
    update: updateAgent,
    setPosition: setAgentPosition,
    setRotation: setAgentRotation,
    hasPendingDynamicTask,
    initialPos,
  } = useAgentController(
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

  // Synchronisation initiale des coordonnées caméra/walker actif dès le montage
  useLayoutEffect(() => {
    if (isActive && !isPreview && initialPos) {
      cameraState.walkerX = initialPos.x;
      cameraState.walkerZ = initialPos.z;
      cameraState.walkYaw = initialPos.rotY;
    }
  }, [isActive, isPreview, initialPos]);

  // Nettoyage de la position enregistrée dans cameraState lors du démontage
  useEffect(() => {
    return () => {
      delete cameraState.positions[id];
    };
  }, [id]);

  // Setup échelle, offsets hanches, physiques et matériaux
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const baseHeight = isLara
      ? 173.4
      : (id === 'hayley' || id === 'gloria' || id === 'zoe' || id === 'sophia' || id === 'valby'
        ? 168.0
        : (findCharacter(id)?.height || 181.0));
    const scaleFactor = (targetHeight / baseHeight) * 100.0;
    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    scene.updateMatrixWorld(true);

    initPhysicsBones(parts);

    if (parts.bones.hips) {
      const parent = scene.parent || scene;
      const hipsWorld = new THREE.Vector3();
      parts.bones.hips.getWorldPosition(hipsWorld);
      const hipsLocal = parent.worldToLocal(hipsWorld);
      scene.position.x -= hipsLocal.x;
      scene.position.z -= hipsLocal.z;
    }

    // Auto-élévation au niveau du sol (Y = 0) pour les modèles ayant leurs pieds modélisés sous Y=0
    if (!isLara) {
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
  }, [scene, parts, isLara, targetHeight, variant, id, laraRealisticTextures]);

  // Textures réalistes (peau et tissus mats) pour les Lara
  useEffect(() => {
    if (!scene || !isLara) return;
    applyLaraRealisticTextures(scene, laraRealisticTextures);
    invalidate();
  }, [scene, isLara, laraRealisticTextures, invalidate]);

  // Visibilité des vêtements et des accessoires (synchronisation réactive unique)
  useEffect(() => {
    if (!scene || !isLara) return;
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
  }, [parts, scene, equipment, laraNude, laraTopOff, laraBottomOff, laraShoes, showAccessories, laraPistols, invalidate, isLara]);

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

  // Événement signalant que le walker est prêt
  useEffect(() => {
    const timeout = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('walker-ready', { detail: { id } }));
    }, 0);
    return () => clearTimeout(timeout);
  }, [id]);

  // Synchronisation walkerAnim en mode preview
  useEffect(() => {
    if (!isPreview) return;
    if (!walkerAnim || walkerAnim === 'idle') {
      currentAnimClip.current = null;
      userAnimOverrideRef.current = false;
      invalidate();
      return;
    }
    loadAndPlayClip(walkerAnim);
  }, [walkerAnim, isPreview, loadAndPlayClip, invalidate]);

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
        if (path === 'idle' || path === 'stop') {
          currentAnimClip.current = null;
          userAnimOverrideRef.current = false;
          invalidate();
        } else {
          loadAndPlayClip(path, e.detail?.loop !== false, true);
        }
      }
      handleToggleHairColor(e);
      handleToggleHaircut(e);
    };

    document.addEventListener('furniture-toggle', onToggle);
    return () => {
      document.removeEventListener('furniture-toggle', onToggle);
    };
  }, [isActive, isLara, id, loadAndPlayClip, invalidate]);

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
      updateCharacterLayers(groupRef.current, isActive && (cameraState.mode === 'fpv' || cameraState.isXR));
    }

    invalidate();
  }, [scene, parts, haircut, hairColor, variant, isActive, invalidate]);

  // Boucle frame principale : positionnement, mix d'animations & physiques
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

    const hasDynamicTask = hasPendingDynamicTask();

    if (isPreview) {
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
    } else if (laraGrid) {
      const { x: targetX, y: targetY, z: targetZ } = getLaraGridPosition(characterIndex, totalCharacters);
      groupRef.current.position.set(targetX, targetY, targetZ);
      groupRef.current.rotation.y = 0;
      const isVisibleInCountMode = isCharacterVisibleInMode(id, laraCount, activeWalkerId, extraCharacters, activeExtraIds);
      groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles && isVisibleInCountMode;
      if (!userAnimOverrideRef.current) {
        currentAnimClip.current = null;
      }
      if (isVisibleInCountMode && !cameraState.walkerHidden && showAllLaraStyles) {
        cameraState.positions[id] = { x: targetX, y: targetY, z: targetZ, yaw: 0 };
      } else {
        delete cameraState.positions[id];
      }
    } else {
      if (isActive) {
        const isUserManuallyMoving = 
          (cameraState.isXR ||
           cameraState.mode === 'fpv' ||
           cameraState.mode === 'orbit') && cameraState.isUserControlling();

        if (hasDynamicTask || isGuidedTour || (!isUserManuallyMoving && isAutonomous)) {
          const agentState = updateAgent(delta);
          groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
          groupRef.current.rotation.y = agentState.rotY;
          currentAnimClip.current = agentState.animation;
          groupRef.current.visible = !cameraState.walkerHidden && agentState.isSpawned;

          cameraState.walkerX = agentState.x;
          cameraState.walkerZ = agentState.z;
          cameraState.walkYaw = agentState.rotY;
          cameraState.isAIControlled = true;
          if (agentState.isSpawned) {
            cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY, anim: agentState.animation };
          } else {
            delete cameraState.positions[id];
          }
        } else {
          groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
          groupRef.current.rotation.y = cameraState.walkYaw;
          groupRef.current.visible = !cameraState.walkerHidden;
          cameraState.isAIControlled = false;
          currentAnimClip.current = null;
          cameraState.positions[id] = { x: cameraState.walkerX, y: 0, z: cameraState.walkerZ, yaw: cameraState.walkYaw, anim: currentAnimClip.current || 'idle' };
          
          setAgentPosition(cameraState.walkerX, 0, cameraState.walkerZ);
          setAgentRotation(cameraState.walkYaw);
        }
      } else if (isNPC) {
        const agentState = updateAgent(delta);
        groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
        groupRef.current.rotation.y = agentState.rotY;
        if (!userAnimOverrideRef.current) {
          currentAnimClip.current = agentState.animation;
        }
        const isVisibleInCountMode = isCharacterVisibleInMode(id, laraCount, activeWalkerId, extraCharacters, activeExtraIds);
        groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles && isVisibleInCountMode && agentState.isSpawned;

        if (agentState.isSpawned && isVisibleInCountMode) {
          cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY, anim: agentState.animation };
        } else {
          delete cameraState.positions[id];
        }
      } else {
        groupRef.current.visible = false;
      }

      const isFirstPerson = isActive && (cameraState.mode === 'fpv' || cameraState.isXR);
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

    const isMoving = !isPreview && isActive && (cameraState.isXR ? cameraState.isMoving : (cameraState.isUserControlling() && cameraState.isMoving));
    const rawTarget = isPreview
      ? (walkerAnim || 'idle')
      : (currentAnimClip.current || (isMoving ? 'walk' : 'idle'));

    if (isActive && !isGuidedTour && !hasDynamicTask && (cameraState.isXR || cameraState.isUserControlling()) && currentAnimClip.current) {
      currentAnimClip.current = null;
    }

    let target = resolveAnimationId(rawTarget);

    const targetDef = getAnimationDef(target);
    const defaultOffset = targetDef?.defaultOffset;
    if (defaultOffset) {
      scene.position.x = baseScenePosRef.current.x + defaultOffset[0];
      scene.position.y = baseScenePosRef.current.y + defaultOffset[1];
      scene.position.z = baseScenePosRef.current.z + defaultOffset[2];
    } else {
      scene.position.copy(baseScenePosRef.current);
    }
    if (isPreview && targetDef?.defaultRotYOffset !== undefined) {
      scene.rotation.y = targetDef.defaultRotYOffset;
    } else if (isPreview) {
      scene.rotation.y = 0;
    }

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

    if (isTPose) {
      if (activeActionName.current !== 't-pose') {
        if (activeActionName.current && actions[activeActionName.current]) {
          actions[activeActionName.current].stop();
        }
        mixer.stopAllAction();
        activeActionName.current = 't-pose';
      }
      scene.traverse((c: any) => {
        if (c.isSkinnedMesh && c.skeleton) {
          c.skeleton.pose();
        }
        if (c.isBone) {
          if (c.userData.restPos) c.position.copy(c.userData.restPos);
          if (c.userData.restQuat) c.quaternion.copy(c.userData.restQuat);
        }
      });
      scene.updateMatrixWorld(true);
    } else {
      const to = actions[target];
      if (to && activeActionName.current !== target) {
        const from = (activeActionName.current && activeActionName.current !== 't-pose') ? actions[activeActionName.current] : null;
        if (from) from.fadeOut(0.2);

        to.setLoop(THREE.LoopRepeat, Infinity);
        to.clampWhenFinished = false;

        to.reset().fadeIn(0.2).play();
        to.setEffectiveWeight(1);
        activeActionName.current = target;

        if (isPreview && !useAnimPreviewStore.getState().isPlaying) {
          to.setEffectiveWeight(1);
          (to as any)._fadeDuration = 0;
          (to as any)._weight = 1;
        }

        if (isActive && !isPreview && !isTemporaryLoadingFallback && lastLoggedAnimRef.current !== target) {
          lastLoggedAnimRef.current = target;
          // Si c'est une animation de marche (déjà mentionnée dans "Marche vers [anim]"), on évite le doublon de log
          const isWalkAnim = target === 'walk' || target.includes('/locomotion/') || target.includes('walk') || target.includes('run');
          if (!isWalkAnim) {
            const cleanName = target.split('/').pop()?.replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ') || target;
            const emoji = (target === resolveAnimationId('idle') || target === 'idle') ? '🧘' : '💃';
            appLog(id, `${emoji} Animation : ${cleanName}`);
          }
        }
      }
    }

    if (isPreview) {
      const store = useAnimPreviewStore.getState();
      const animDelta = delta * (store.speed || 1);

      if (isTPose) {
        store.setClipInfo('T-Pose', 0, true);
      } else if (isDuoRoleB) {
        // En mode Duo, le Rôle B suit STRICTEMENT l'horloge partagée pilotée par le Rôle A
        if (activeActionName.current && actions[activeActionName.current]) {
          const actB = actions[activeActionName.current];
          const clipB = actB.getClip();
          if (clipB && clipB.duration > 0) {
            if (store.isPlaying && !store.isScrubbing) {
              actB.time = store.currentTime % clipB.duration;
              actB.paused = false;
              mixer.update(animDelta);
            } else {
              actB.setEffectiveWeight(1);
              (actB as any)._fadeDuration = 0;
              (actB as any)._weight = 1;
              actB.time = store.currentTime % clipB.duration;
              mixer.update(0);
            }
          }
        }
      } else if (activeActionName.current && actions[activeActionName.current]) {
        const act = actions[activeActionName.current];
        const clip = act.getClip();
        if (clip && clip.duration > 0) {
          const cleanName = duoAnimDef
            ? duoAnimDef.label
            : (activeActionName.current.split('/').pop()?.replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ') || activeActionName.current);
          store.setClipInfo(cleanName, clip.duration, false);

          if (store.isPlaying && !store.isScrubbing) {
            act.paused = false;
            mixer.update(animDelta);
            store.setCurrentTime(act.time % clip.duration);
          } else {
            act.setEffectiveWeight(1);
            (act as any)._fadeDuration = 0;
            (act as any)._weight = 1;
            act.time = store.currentTime;
            mixer.update(0);
          }
        }
      }

      const isVisibleInFrustum = (() => {
        if (!state.camera) return true;
        const cam = state.camera;
        _charProjScreenMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
        _charFrustum.setFromProjectionMatrix(_charProjScreenMatrix);
        _charBoundingSphere.center.copy(groupRef.current.position);
        _charBoundingSphere.center.y += 90; // Centre approximatif du buste/tête
        _charBoundingSphere.radius = 120;
        return _charFrustum.intersectsSphere(_charBoundingSphere);
      })();

      if (isVisibleInFrustum) {
        updatePhysics(store.isPlaying && !isTPose ? delta * store.speed : 0, {
          haircut,
          isMoving,
          targetAnim: target,
          walkerAnim,
          clockElapsedTime: store.currentTime
        }, scene);
      }
    } else if (!isPaused && !isTPose) {
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
      mixer.update(delta);

      // Parachute d'atterrissage réactif
      const falling = currentAnimClip.current === 'falling' || currentAnimClip.current === 'animations/locomotion/anim_falling.glb';
      if (isFalling !== falling) {
        setIsFalling(falling);
      }

      // Simulation Verlet (cheveux, perruques, poitrine)
      // Optimisation Frustum Culling : on n'exécute la physique que si le personnage est visible par la caméra
      const isVisibleInFrustum = (() => {
        if (!state.camera) return true;
        const cam = state.camera;
        _charProjScreenMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
        _charFrustum.setFromProjectionMatrix(_charProjScreenMatrix);
        _charBoundingSphere.center.copy(groupRef.current.position);
        _charBoundingSphere.center.y += 90; // Centre approximatif du buste/tête
        _charBoundingSphere.radius = 120;
        return _charFrustum.intersectsSphere(_charBoundingSphere);
      })();

      if (isVisibleInFrustum) {
        updatePhysics(delta, {
          haircut,
          isMoving,
          targetAnim: target,
          walkerAnim,
          clockElapsedTime: state.clock.elapsedTime
        }, scene);
      }
    }

    // Suivi dynamique de la tête, du torse et des yeux (3ème personne et FPV réaliste)
    if (isActive && !isPreview) {
      if (headBone) {
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
          _tmpEyesWorldPos.copy(_tmpHeadWorldPos)
            .addScaledVector(_tmpHeadUp, 10.16)
            .addScaledVector(_tmpHeadForward, 7.04);
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
  });

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
        hoverAction: isPreview || isActive ? undefined : {
          label: charLabel,
          actions: [`select-walker-${id}`]
        }
      }}
    >
      <primitive ref={modelRef} object={scene} />

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
      {!isPreview && <HeartParachute visible={isFalling} />}
      {!isPreview ? (
        isActive ? <GroundPoint color="#0058a3" /> : <GroundPoint color="#ff2222" />
      ) : (
        isDuoRoleB && <GroundPoint color="#ff2222" />
      )}
      {!isPreview && isActive && showThoughtBubble && (
        <CharacterThoughtBubble
          characterId={id}
          characterName={charLabel}
          isActive={isActive}
          isFirstPerson={cameraMode === 'fpv' || cameraState.mode === 'fpv' || cameraState.isXR}
        />
      )}
    </group>
  );
}
