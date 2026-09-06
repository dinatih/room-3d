/**
 * SingleCharacter.tsx — Personnages (Walkers & NPCs).
 * Version modulaire intégrant animations, physique Verlet, styles/accessoires et agent IA.
 */
import { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { Wig, HAIR_COLORS } from '../items/Wig';
import { applyLaraVariantStyles, disposeLaraVariantMaterials } from '../LaraVariants';
import { isCharacterVisibleInMode, AUTONOMOUS_NPC_IDS } from '../walkerConfig';
import { buildHairChain } from '../retargeting';
import {
  extractCharacterParts,
  applyClothingAndAccessoriesVisibility,
  applyRenderProperties,
} from '../characterParts';
import { ACTION_FULL_TOUR, buildAutonomousScenario } from '../ai/scenarios';
import type { AgentInstruction } from '../ai/aiTypes';
import { useAgentController } from '../ai/useAgentController';
import { duoSessionManager } from '../ai/duoSessionManager';
import { appLog } from '@features/ui/AppConsole';
import { APP_IDLE_TIMEOUT_SECONDS, isAppIdle } from '../idleState';
import { CharacterThoughtBubble } from '../CharacterThoughtBubble';

import type { SingleCharacterProps } from './characterTypes';
import { updateCharacterLayers } from './characterLayers';
import { GroundPoint } from './GroundPoint';
import { HeartParachute } from './HeartParachute';
import { useCharacterAnimations } from './useCharacterAnimations';
import { useCharacterPhysics } from './useCharacterPhysics';

const EMPTY_SCENARIO: AgentInstruction[] = [];

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
  previewPosition,
  previewRotationY
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
  const showThoughtBubble = useSceneStore(state => state.layers.thoughtBubble ?? true);
  const cameraMode = useSceneStore(state => state.cameraMode);
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const extraStates = useSceneStore(state => state.extraStates);

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

  useEffect(() => () => disposeLaraVariantMaterials(scene), [scene]);

  // Extraction structurée des maillages et des os
  const parts = useMemo(() => extractCharacterParts(scene), [scene]);

  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
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
    animations,
    sittingScene,
    invalidate
  });

  const {
    hairChainRef,
    customHairChainRef,
    initPhysicsBones,
    updatePhysics
  } = useCharacterPhysics();

  // Rotation périodique coiffures variant LGBT+
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
    if (extraStates.aiFullTour) return 'aiFullTour';
    return null;
  }, [extraStates]);

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

  const isExcepted = id === 'xbot';
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

  // Setup échelle, offsets hanches, physiques et matériaux
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const baseHeight = isLara ? 173.4 : 181.0;
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

    if (variant) {
      applyLaraVariantStyles(scene, variant);
    }

    hairChainRef.current = buildHairChain(parts.bones.nativeHairBones);
  }, [scene, parts, isLara, targetHeight, variant]);

  // Visibilité des vêtements et des accessoires (synchronisation réactive unique)
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
      const ghostWigs = headBone.children.filter((c: any) => c.userData.isWigRoot || c.name.toLowerCase().includes('hair') || c.name.includes('_ARM_'));
      ghostWigs.forEach((w: any) => headBone.remove(w));
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
        currentAnimClip.current = null;
      }
    } else {
      if (isActive) {
        const isUserManuallyMoving = 
          cameraState.isXR ||
          cameraState.mode === 'walk' ||
          cameraState.mode === 'fpv' ||
          (cameraState.mode === 'orbit' && cameraState.isUserControlling());

        if (!cameraState.isXR && (isGuidedTour || (!isUserManuallyMoving && isAutonomous))) {
          const agentState = updateAgent(delta);
          groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
          groupRef.current.rotation.y = agentState.rotY;
          currentAnimClip.current = agentState.animation;
          groupRef.current.visible = !cameraState.walkerHidden;

          cameraState.walkerX = agentState.x;
          cameraState.walkerZ = agentState.z;
          cameraState.walkYaw = agentState.rotY;
          cameraState.isAIControlled = true;
          cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY };
        } else {
          groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
          groupRef.current.rotation.y = cameraState.walkYaw;
          groupRef.current.visible = !cameraState.walkerHidden;
          cameraState.isAIControlled = false;
          currentAnimClip.current = null;
          cameraState.positions[id] = { x: cameraState.walkerX, y: 0, z: cameraState.walkerZ, yaw: cameraState.walkYaw };
          
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

    const isMoving = !isPreview && isActive && (cameraState.isXR ? cameraState.isMoving : (cameraState.isUserControlling() && cameraState.isMoving));
    let target = isPreview
      ? (walkerAnim || 'idle')
      : (currentAnimClip.current || (isMoving ? 'walk' : 'idle'));

    if (isActive && !isGuidedTour && (cameraState.isXR || cameraState.isUserControlling()) && currentAnimClip.current) {
      currentAnimClip.current = null;
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

        to.setLoop(THREE.LoopRepeat, Infinity);
        to.clampWhenFinished = false;

        to.reset().fadeIn(0.2).play();
        to.setEffectiveWeight(1);
        activeActionName.current = target;

        if (isActive && !isPreview && lastLoggedAnimRef.current !== target) {
          lastLoggedAnimRef.current = target;
          const cleanName = target.split('/').pop()?.replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ') || target;
          const emoji = target === 'walk' ? '🚶‍♂️' : (target === 'idle' ? '🧘' : '💃');
          appLog(id, `${emoji} Animation : ${cleanName}`);
        }
      }
    }

    if (!isPaused && !isTPose) {
      if (isPreview && walkerAnim && walkerAnim !== 'idle' && walkerAnim !== 'tpose' && activeActionName.current && actions[activeActionName.current]) {
        const act = actions[activeActionName.current];
        const clip = act.getClip();
        if (clip && clip.duration > 0) {
          act.time = state.clock.elapsedTime % clip.duration;
        }
      } else if (!isPreview && duoSessionManager.isPlaying()) {
        const partA = duoSessionManager.getParticipantA();
        const partB = duoSessionManager.getParticipantB();
        if (partA?.characterId === id || partB?.characterId === id) {
          const currentAnimState = duoSessionManager.getCurrentAnimState();
          if (currentAnimState && activeActionName.current && (currentAnimState.clipA === activeActionName.current || currentAnimState.clipB === activeActionName.current)) {
            const act = actions[activeActionName.current];
            if (act) {
              const clipDur = act.getClip().duration;
              if (clipDur > 0) {
                const elapsed = duoSessionManager.getElapsedTimeInRepeat();
                act.time = elapsed % clipDur;
              }
            }
          }
        }
      }
      mixer.update(delta);

      // Parachute d'atterrissage réactif
      const falling = currentAnimClip.current === 'animations/locomotion/anim_falling.glb';
      if (isFalling !== falling) {
        setIsFalling(falling);
      }

      // Simulation Verlet (cheveux, perruques, poitrine)
      updatePhysics(delta, {
        haircut,
        isMoving,
        targetAnim: target,
        walkerAnim,
        clockElapsedTime: state.clock.elapsedTime
      }, scene);
    }
  });

  const headBone = parts.bones.head;

  return (
    <group
      ref={groupRef}
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
      {!isPreview && (isActive ? <GroundPoint color="#0058a3" /> : <GroundPoint color="#ff2222" />)}
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
