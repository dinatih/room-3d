import { useRef, useEffect } from 'react';
import { AgentInstruction } from './aiTypes';
import { SMART_OBJECTS, buildSmartObjectInstructionSequence } from './smartObjectRegistry';
import { resolveSlotAnimation } from './animationPacks';
import { OccupancyManager } from './occupancyManager';
import { duoSessionManager, DuoRole } from './duoSessionManager';
import { buildNavigationWaypoints, getRoomFromCoords } from './navigationGraph';
import { useSceneStore, resolveStoreKey } from '../store/useSceneStore';
import { appLog } from '@features/ui/AppConsole';
import { getEstimatedClipDuration } from '../animOptions';

import { AgentState, AgentStatus } from './agent/agentTypes';
import { NPC_WALK_ANIMATIONS, getRandomNpcWalkAnimation } from './agent/agentWalkAnimations';
import { resolveInstructionCoords } from './agent/agentInstructionCoords';
import { computeSteeringVector, computeRotYStep } from './agent/agentAvoidance';
import { handleDuoInteraction } from './agent/agentDuoHandler';

export type { AgentState };
export { NPC_WALK_ANIMATIONS, getRandomNpcWalkAnimation };

export function useAgentController(
  _characterId: string,
  scenario: AgentInstruction[] | null,
  loop: boolean = false,
  getRealPosition: () => { x: number; y: number; z: number; rotY: number },
  onComplete?: () => void,
  spawnDelay: number = 0,
  hasSkyDrop: boolean = false
) {
  const firstCoords = (scenario && scenario.length > 0) ? resolveInstructionCoords(scenario[0], null) : null;
  const initialPos = (firstCoords && (firstCoords.tx !== 0 || firstCoords.tz !== 0))
    ? { x: firstCoords.tx, y: firstCoords.ty ?? 0, z: firstCoords.tz, rotY: firstCoords.rotY ?? 0 }
    : getRealPosition();

  const isWaiting = hasSkyDrop && spawnDelay > 0;
  const isFallingImmediately = hasSkyDrop && spawnDelay === 0;

  const stateRef = useRef<AgentState>({
    x: initialPos.x,
    y: hasSkyDrop ? 2500 : initialPos.y,
    z: initialPos.z,
    rotY: initialPos.rotY,
    animation: isFallingImmediately ? 'animations/locomotion/anim_falling.glb' : (hasSkyDrop ? 'idle' : (firstCoords?.anim || 'idle')),
    isSpawned: !isWaiting
  });

  const stepIndexRef = useRef(0);
  const timerRef = useRef(isFallingImmediately ? 6.0 : 0);
  const statusRef = useRef<AgentStatus>(
    isWaiting ? 'WAITING' : (isFallingImmediately ? 'FALLING' : 'IDLE')
  );
  const delayTimerRef = useRef(spawnDelay);
  const prevScenarioRef = useRef<AgentInstruction[] | null | undefined>(undefined);
  const startPosRef = useRef<{ x: number; y: number; z: number; rotY: number } | null>(initialPos);
  const claimedSlotRef = useRef<{ objectId: string; slotId: string } | null>(null);

  // Navigation dynamique inter-pièces
  const dynamicNavQueueRef = useRef<AgentInstruction[]>([]);
  const dynamicNavIndexRef = useRef(0);
  const activeNavStepIndexRef = useRef<number>(-1);

  // Animation de marche courante pour les trajets
  const currentWalkAnimRef = useRef<string>(getRandomNpcWalkAnimation(_characterId));

  // Ref pour éviter les logs dupliqués à chaque frame
  const lastLogRef = useRef<string>('');

  // Gestion spécifique du rôle et attente pour la duo-zone
  const duoRoleRef = useRef<DuoRole | null>(null);
  const duoWaitTimerRef = useRef<number>(0);
  const duoInvitedRef = useRef<boolean>(false);

  // Répétitions d'animation et variations pour SmartObjects
  const repeatIndexRef = useRef<number>(0);
  const targetRepeatsRef = useRef<number>(1);
  const repeatVariationRef = useRef<boolean>(false);
  const currentClipDurationRef = useRef<number>(4.0);

  // Cache de la résolution de l'instruction en cours pour éviter de réallouer / recalculer resolveInstructionCoords à chaque frame
  const cachedCoordsRef = useRef<ReturnType<typeof resolveInstructionCoords> | null>(null);
  const cachedCoordsInstructionRef = useRef<AgentInstruction | null>(null);

  const getResolvedCoords = (instr: AgentInstruction) => {
    if (cachedCoordsInstructionRef.current !== instr || !cachedCoordsRef.current) {
      cachedCoordsInstructionRef.current = instr;
      cachedCoordsRef.current = resolveInstructionCoords(instr, startPosRef.current);
    }
    return cachedCoordsRef.current;
  };

  const releaseClaimedSlot = () => {
    if (claimedSlotRef.current) {
      OccupancyManager.releaseSlot(claimedSlotRef.current.objectId, claimedSlotRef.current.slotId, _characterId);
      claimedSlotRef.current = null;
    }
  };

  // Libérer toutes les réservations au démontage et écouter les invitations de duo
  useEffect(() => {
    const onInvite = (e: any) => {
      if (e.detail?.targetId === _characterId) {
        const role = (e.detail?.forceRole as DuoRole) || duoSessionManager.joinDuoZone(_characterId);
        if (role) {
          duoRoleRef.current = role;
          if (claimedSlotRef.current && (claimedSlotRef.current.objectId !== 'duo-zone' || claimedSlotRef.current.slotId !== role)) {
            releaseClaimedSlot();
          }
          claimedSlotRef.current = { objectId: 'duo-zone', slotId: role };

          if (e.detail?.alreadyThere) {
            statusRef.current = 'INTERACTING';
            dynamicNavQueueRef.current = [
              { type: 'USE_OBJECT', smartObjectId: 'duo-zone', slotId: role }
            ];
            dynamicNavIndexRef.current = 0;
            duoSessionManager.markReady(_characterId);
            const animState = duoSessionManager.getCurrentAnimState();
            if (animState) {
              stateRef.current.animation = role === 'roleA' ? animState.clipA : animState.clipB;
            }
          } else {
            dynamicNavQueueRef.current = [
              { type: 'USE_OBJECT', smartObjectId: 'duo-zone', slotId: role }
            ];
            dynamicNavIndexRef.current = 0;
            statusRef.current = 'IDLE';
            appLog(_characterId, `🏃‍♂️ Répond à l'appel de ${e.detail.fromId} (${role === 'roleA' ? 'Meneur' : 'Partenaire'}) et rejoint la ✨ Scène Duo !`);
          }
        }
      }
    };

    const onClipLoaded = (e: any) => {
      if (e.detail?.id === _characterId && typeof e.detail?.duration === 'number' && e.detail.duration > 0) {
        currentClipDurationRef.current = e.detail.duration;
        if (statusRef.current === 'INTERACTING') {
          const queue = dynamicNavQueueRef.current;
          const idx = dynamicNavIndexRef.current;
          const currentInstruction = (queue.length > 0 && idx < queue.length)
            ? queue[idx]
            : (scenario && stepIndexRef.current < scenario.length ? scenario[stepIndexRef.current] : null);
          if (currentInstruction && !currentInstruction.duration) {
            timerRef.current = e.detail.duration;
          }
        }
      }
    };

    const onForceSmartObject = (e: any) => {
      if (e.detail?.targetId === _characterId && e.detail?.objectId) {
        const { objectId, slotId } = e.detail;
        releaseClaimedSlot();
        duoSessionManager.leaveDuoZone(_characterId);
        duoRoleRef.current = null;
        duoInvitedRef.current = false;

        const seq = buildSmartObjectInstructionSequence(objectId, slotId, _characterId);
        if (seq && seq.length > 0) {
          dynamicNavQueueRef.current = seq;
          dynamicNavIndexRef.current = 0;
          activeNavStepIndexRef.current = -1;
          statusRef.current = 'IDLE';
          cachedCoordsInstructionRef.current = null;
          cachedCoordsRef.current = null;
          appLog(_characterId, `⚡ Ordre direct reçu : ${objectId}${slotId ? ` (${slotId})` : ''}`);
        }
      }
    };

    document.addEventListener('npc-invite-duo', onInvite);
    document.addEventListener('walker-clip-loaded', onClipLoaded);
    document.addEventListener('agent-force-smartobject', onForceSmartObject);
    return () => {
      document.removeEventListener('npc-invite-duo', onInvite);
      document.removeEventListener('walker-clip-loaded', onClipLoaded);
      document.removeEventListener('agent-force-smartobject', onForceSmartObject);
      OccupancyManager.releaseAllForCharacter(_characterId);
      duoSessionManager.leaveDuoZone(_characterId);
    };
  }, [_characterId]);

  if (scenario !== prevScenarioRef.current) {
    if (claimedSlotRef.current) {
      OccupancyManager.releaseAllForCharacter(_characterId);
      duoSessionManager.leaveDuoZone(_characterId);
      claimedSlotRef.current = null;
      duoRoleRef.current = null;
      duoInvitedRef.current = false;
    }
    const isWait = hasSkyDrop && spawnDelay > 0;
    const isFallNow = hasSkyDrop && spawnDelay === 0;

    stepIndexRef.current = 0;
    repeatIndexRef.current = 0;
    targetRepeatsRef.current = 1;
    timerRef.current = isFallNow ? 6.0 : 0;
    statusRef.current = isWait ? 'WAITING' : (isFallNow ? 'FALLING' : 'IDLE');
    delayTimerRef.current = spawnDelay;
    prevScenarioRef.current = scenario;
    dynamicNavQueueRef.current = [];
    dynamicNavIndexRef.current = 0;
    activeNavStepIndexRef.current = -1;
    cachedCoordsInstructionRef.current = null;
    cachedCoordsRef.current = null;

    if (scenario) {
      const stepCoords = scenario.length > 0 ? resolveInstructionCoords(scenario[0], null) : null;
      const real = (stepCoords && (stepCoords.tx !== 0 || stepCoords.tz !== 0))
        ? { x: stepCoords.tx, y: stepCoords.ty ?? 0, z: stepCoords.tz, rotY: stepCoords.rotY ?? 0 }
        : getRealPosition();

      stateRef.current.x = real.x;
      stateRef.current.y = hasSkyDrop ? 2500 : real.y;
      stateRef.current.z = real.z;
      stateRef.current.rotY = real.rotY;
      stateRef.current.isSpawned = !isWait;
      stateRef.current.animation = isFallNow ? 'animations/locomotion/anim_falling.glb' : (hasSkyDrop ? 'idle' : (stepCoords?.anim || 'idle'));
      startPosRef.current = { x: real.x, y: real.y, z: real.z, rotY: real.rotY };
      if (isFallNow) {
        appLog(_characterId, `🪂 Déploiement : Tombée du ciel en parachute`);
      }
    }
  }

  const SPEED = 100;
  const ROT_SPEED = 5;

  const triggerInstructionEvent = (instruction: AgentInstruction) => {
    if (!instruction.triggerEventKey) return;
    const key = instruction.triggerEventKey;
    const store = useSceneStore.getState();
    const resolved = resolveStoreKey(key);
    const furniture = store.furniture as any;
    const extraStates = store.extraStates as any;

    const currentVal = resolved.type === 'furniture'
      ? Boolean(furniture[resolved.name])
      : resolved.type === 'extra'
      ? Boolean(extraStates[resolved.name])
      : false;

    if (instruction.triggerTargetState !== undefined) {
      if (instruction.triggerTargetState !== currentVal) {
        store.triggerAction(key);
      }
    } else {
      store.triggerAction(key);
    }
  };

  const advanceToNextStep = (hasNavStep: boolean) => {
    cachedCoordsInstructionRef.current = null;
    cachedCoordsRef.current = null;
    if (hasNavStep) {
      dynamicNavIndexRef.current++;
      if (dynamicNavIndexRef.current >= dynamicNavQueueRef.current.length) {
        dynamicNavQueueRef.current = [];
        dynamicNavIndexRef.current = 0;
      }
    } else {
      stepIndexRef.current++;
      const nextInstr = scenario && stepIndexRef.current < scenario.length ? scenario[stepIndexRef.current] : null;
      if (claimedSlotRef.current && (!nextInstr || nextInstr.smartObjectId !== claimedSlotRef.current.objectId)) {
        releaseClaimedSlot();
      }
    }
  };

  const resetDuoState = () => {
    duoSessionManager.leaveDuoZone(_characterId);
    claimedSlotRef.current = null;
    duoRoleRef.current = null;
    duoInvitedRef.current = false;
    dynamicNavQueueRef.current = [];
    dynamicNavIndexRef.current = 0;
    cachedCoordsInstructionRef.current = null;
    cachedCoordsRef.current = null;
    statusRef.current = 'IDLE';
  };

  const update = (dt: number): AgentState => {
    const hasNavStepInUpdate = dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
    if (!scenario && !hasNavStepInUpdate) {
      stateRef.current.animation = 'idle';
      return stateRef.current;
    }

    // ── 1. Gestion SkyDrop (Spawn / Chute / Atterrissage) ──
    if (statusRef.current === 'WAITING') {
      delayTimerRef.current -= dt;
      if (delayTimerRef.current <= 0) {
        statusRef.current = 'FALLING';
        timerRef.current = 6.0;
        stateRef.current.isSpawned = true;
        appLog(_characterId, `🪂 Déploiement : Tombée du ciel en parachute`);
      }
      stateRef.current.animation = 'idle';
      return stateRef.current;
    }

    if (statusRef.current === 'FALLING') {
      timerRef.current -= dt;
      if (timerRef.current <= 0) {
        stateRef.current.y = startPosRef.current?.y ?? 0;
        statusRef.current = 'LANDING';
        timerRef.current = 1.96;
      } else {
        const p_inv = timerRef.current / 6.0;
        const targetY = startPosRef.current?.y ?? 0;
        stateRef.current.y = targetY + (2500 - targetY) * (p_inv * p_inv * p_inv);
      }
      stateRef.current.animation = 'animations/locomotion/anim_falling.glb';
      return stateRef.current;
    }

    if (statusRef.current === 'LANDING') {
      timerRef.current -= dt;
      if (timerRef.current <= 0) {
        statusRef.current = 'IDLE';
        appLog(_characterId, `🎯 Déploiement terminé (Atterrissage réussi)`);
      }
      stateRef.current.animation = 'animations/poses_idles/anim_crouch_to_stand.glb';
      return stateRef.current;
    }

    const scenarioLength = scenario ? scenario.length : 0;

    // ── 2. Fin de scénario / Bouclage ──
    if (stepIndexRef.current >= scenarioLength && dynamicNavQueueRef.current.length === 0) {
      releaseClaimedSlot();
      if (loop && scenarioLength > 0) {
        stepIndexRef.current = 0;
        activeNavStepIndexRef.current = -1;
        cachedCoordsInstructionRef.current = null;
        cachedCoordsRef.current = null;
        const loopKey = `loop-${_characterId}`;
        if (lastLogRef.current !== loopKey) {
          lastLogRef.current = loopKey;
          appLog(_characterId, '🔄 Nouveau cycle d\'activité autonome');
        }
      } else {
        if (statusRef.current !== 'FINISHED') {
          statusRef.current = 'FINISHED';
          if (onComplete) onComplete();
        }
        stateRef.current.animation = 'idle';
        return stateRef.current;
      }
    }

    const hasNavStep = dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
    const currentInstruction = hasNavStep
      ? dynamicNavQueueRef.current[dynamicNavIndexRef.current]
      : (scenario ? scenario[stepIndexRef.current] : null);

    if (!currentInstruction) {
      stateRef.current.animation = 'idle';
      return stateRef.current;
    }

    // ── 3. État IDLE : Initialisation et réservation de l'instruction ──
    if (statusRef.current === 'IDLE') {
      if (!hasNavStep && currentInstruction.smartObjectId) {
        const objId = currentInstruction.smartObjectId;
        const reqSlotId = currentInstruction.slotId || SMART_OBJECTS[objId]?.slots[0]?.slotId || 'default';

        if (objId === 'duo-zone') {
          const role = duoSessionManager.joinDuoZone(_characterId);
          if (role) {
            duoRoleRef.current = role;
            currentInstruction.slotId = role;
            claimedSlotRef.current = { objectId: objId, slotId: role };
            const slot = SMART_OBJECTS[objId]?.slots.find(s => s.slotId === role);
            if (slot) {
              currentInstruction.animation = slot.animation;
              currentInstruction.duration = slot.duration;
              currentInstruction.rotY = slot.rotY;
            }
          } else if (loop && scenario) {
            while (stepIndexRef.current < scenario.length && scenario[stepIndexRef.current].smartObjectId === objId) {
              stepIndexRef.current++;
            }
            dynamicNavQueueRef.current = [];
            dynamicNavIndexRef.current = 0;
            cachedCoordsInstructionRef.current = null;
            cachedCoordsRef.current = null;
            return update(dt);
          }
        } else if (OccupancyManager.isSlotOccupied(objId, reqSlotId, _characterId)) {
          const altSlotId = OccupancyManager.getAvailableSlot(objId, _characterId, currentInstruction.slotId);
          if (altSlotId) {
            currentInstruction.slotId = altSlotId;
            const newSlot = SMART_OBJECTS[objId]?.slots.find(s => s.slotId === altSlotId);
            if (newSlot) {
              const resolved = resolveSlotAnimation(newSlot);
              currentInstruction.animation = resolved.animation;
              currentInstruction.duration = newSlot.duration;
              currentInstruction.rotY = resolved.rotY;
            }
            OccupancyManager.claimSlot(objId, altSlotId, _characterId);
            claimedSlotRef.current = { objectId: objId, slotId: altSlotId };
          } else {
            const occupant = OccupancyManager.getOccupant(objId, reqSlotId);
            const objName = SMART_OBJECTS[objId]?.name || objId;

            if (loop && scenario) {
              appLog(_characterId, `⚠️ ${objName} est occupé${occupant ? ` (${occupant})` : ''}, recherche d'une autre place...`);
              while (stepIndexRef.current < scenario.length && scenario[stepIndexRef.current].smartObjectId === objId) {
                stepIndexRef.current++;
              }
              dynamicNavQueueRef.current = [];
              dynamicNavIndexRef.current = 0;
              cachedCoordsInstructionRef.current = null;
              cachedCoordsRef.current = null;
              return update(dt);
            } else {
              appLog(_characterId, `⚠️ ${objName} est actuellement occupé${occupant ? ` (${occupant})` : ''}`);
              statusRef.current = 'FINISHED';
              if (onComplete) onComplete();
              stateRef.current.animation = 'idle';
              return stateRef.current;
            }
          }
        } else {
          OccupancyManager.claimSlot(objId, reqSlotId, _characterId);
          claimedSlotRef.current = { objectId: objId, slotId: reqSlotId };
          const chosenSlot = SMART_OBJECTS[objId]?.slots.find(s => s.slotId === reqSlotId);
          if (chosenSlot && !currentInstruction.animation) {
            const resolved = resolveSlotAnimation(chosenSlot);
            currentInstruction.animation = resolved.animation;
            if (chosenSlot.duration && !currentInstruction.duration) currentInstruction.duration = chosenSlot.duration;
            if (currentInstruction.rotY === undefined) currentInstruction.rotY = resolved.rotY;
          }
        }
      }

      if (currentInstruction.type === 'MOVE_TO' || currentInstruction.type === 'RETURN_TO_START' || currentInstruction.type === 'USE_OBJECT') {
        const target = getResolvedCoords(currentInstruction);

        if (!hasNavStep && activeNavStepIndexRef.current !== stepIndexRef.current) {
          activeNavStepIndexRef.current = stepIndexRef.current;
          const startRoom = getRoomFromCoords(stateRef.current.x, stateRef.current.z);
          const targetRoom = getRoomFromCoords(target.tx, target.tz);

          if (startRoom !== targetRoom) {
            const navSteps = buildNavigationWaypoints(
              { x: stateRef.current.x, z: stateRef.current.z },
              { x: target.tx, z: target.tz }
            );
            if (navSteps.length > 0) {
              dynamicNavQueueRef.current = navSteps;
              dynamicNavIndexRef.current = 0;
              cachedCoordsInstructionRef.current = null;
              cachedCoordsRef.current = null;
              return update(dt);
            }
          }
        }

        statusRef.current = 'MOVING';
        stateRef.current.animation = currentWalkAnimRef.current;
        stateRef.current.y = 0;
        const logKey = `move-${stepIndexRef.current}-${dynamicNavIndexRef.current}-${target.label}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          const animName = (currentWalkAnimRef.current || 'walk')
            .split('/').pop()?.replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ') || 'walk';
          appLog(_characterId, `🚶‍♂️ Marche vers ${target.label} (${target.tx.toFixed(0)}, ${target.tz.toFixed(0)}) [${animName}]`);
        }
      } else if (currentInstruction.type === 'INTERACT' || currentInstruction.type === 'WAIT') {
        if (currentInstruction.triggerEventKey) {
          const store = useSceneStore.getState();
          const resolved = resolveStoreKey(currentInstruction.triggerEventKey);
          const furniture = store.furniture as any;
          const extraStates = store.extraStates as any;

          const currentVal = resolved.type === 'furniture'
            ? Boolean(furniture[resolved.name])
            : resolved.type === 'extra'
            ? Boolean(extraStates[resolved.name])
            : false;

          if (currentInstruction.triggerTargetState !== undefined && currentVal === currentInstruction.triggerTargetState) {
            advanceToNextStep(hasNavStep);
            return update(dt);
          }
          store.triggerAction(currentInstruction.triggerEventKey);
        }

        statusRef.current = 'INTERACTING';
        const target = getResolvedCoords(currentInstruction);
        if (!currentInstruction.animation && target.anim) currentInstruction.animation = target.anim;
        if (currentInstruction.rotY === undefined && target.rotY !== undefined) currentInstruction.rotY = target.rotY;
        if (!currentInstruction.duration && target.duration) currentInstruction.duration = target.duration;
        timerRef.current = currentInstruction.duration || target.duration || 1.0;

        const animation = currentInstruction.animation || target.anim || '';
        const objName = currentInstruction.smartObjectId ? (SMART_OBJECTS[currentInstruction.smartObjectId]?.name || currentInstruction.smartObjectId) : '';
        const logKey = `interact-${stepIndexRef.current}-${dynamicNavIndexRef.current}-${animation}-${objName}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          const slotInfo = currentInstruction.slotId ? ` (slot ${currentInstruction.slotId})` : '';
          const triggerInfo = currentInstruction.triggerEventKey ? ` ⚡ ${currentInstruction.triggerEventKey}` : '';
          const label = animation
            ? animation.replace('animations/', '').replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ')
            : currentInstruction.type;
          const objPrefix = objName ? `[${objName}${slotInfo}] ` : '';
          appLog(_characterId, `🎭 Action: ${objPrefix}${label}${triggerInfo} (${timerRef.current.toFixed(1)}s)`);
        }
      } else if (currentInstruction.type === 'ROTATE_360') {
        statusRef.current = 'INTERACTING';
        const duration = currentInstruction.duration || 5.0;
        timerRef.current = duration;
        stateRef.current.animation = currentInstruction.animation || 'animations/locomotion/anim_right_turn.glb';
        const logKey = `rotate360-${stepIndexRef.current}-${dynamicNavIndexRef.current}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          appLog(_characterId, `🔄 Inspection 360° en cours (${duration.toFixed(1)}s)`);
        }
      }
    }

    // ── 4. Déplacement (MOVING) ──
    if (statusRef.current === 'MOVING') {
      const target = getResolvedCoords(currentInstruction);
      const dx = target.tx - stateRef.current.x;
      const dz = target.tz - stateRef.current.z;
      const dist = Math.hypot(dx, dz);

      const isDuoZone = currentInstruction.smartObjectId === 'duo-zone';
      const ARRIVAL_THRESHOLD = isDuoZone ? 30.0 : ((currentInstruction.type === 'USE_OBJECT' || (!hasNavStep && currentInstruction.smartObjectId)) ? 8.0 : 18.0);

      if (dist < ARRIVAL_THRESHOLD) {
        stateRef.current.x = target.tx;
        stateRef.current.z = target.tz;

        if (currentInstruction.type === 'USE_OBJECT') {
          statusRef.current = 'INTERACTING';
          repeatIndexRef.current = 0;
          targetRepeatsRef.current = currentInstruction.repeatCount ?? target.repeatCount ?? 1;
          repeatVariationRef.current = currentInstruction.repeatVariation ?? target.repeatVariation ?? false;

          if (currentInstruction.smartObjectId === 'duo-zone') {
            duoSessionManager.markReady(_characterId);
            duoWaitTimerRef.current = 0;
            const animState = duoSessionManager.getCurrentAnimState();
            timerRef.current = animState?.duration ?? 5.0;
            stateRef.current.animation = duoRoleRef.current === 'roleA'
              ? 'animations/poses_idles/anim_female_standing_pose.glb'
              : 'animations/poses_idles/anim_female_standing_pose_1.glb';
          }

          if (!currentInstruction.animation && target.anim) currentInstruction.animation = target.anim;
          if (currentInstruction.rotY === undefined && target.rotY !== undefined) currentInstruction.rotY = target.rotY;
          if (!currentInstruction.duration && target.duration) currentInstruction.duration = target.duration;

          if (currentInstruction.smartObjectId !== 'duo-zone') {
            const explicitDuration = currentInstruction.duration || target.duration;
            timerRef.current = explicitDuration || getEstimatedClipDuration(currentInstruction.animation || target.anim);
          }

          stateRef.current.y = target.ty ?? 0;
          if (currentInstruction.rotY !== undefined) stateRef.current.rotY = currentInstruction.rotY;

          triggerInstructionEvent(currentInstruction);

          const animation = currentInstruction.animation || target.anim || '';
          const isDuoWaiting = currentInstruction.smartObjectId === 'duo-zone' && duoSessionManager.isWaitingPartner(_characterId);
          if (!isDuoWaiting) {
            const objName = currentInstruction.smartObjectId ? (SMART_OBJECTS[currentInstruction.smartObjectId]?.name || currentInstruction.smartObjectId) : '';
            const logKey = `interact-${stepIndexRef.current}-${animation}-${objName}`;
            if (lastLogRef.current !== logKey) {
              lastLogRef.current = logKey;
              const slotInfo = currentInstruction.slotId ? ` (slot ${currentInstruction.slotId})` : '';
              const triggerInfo = currentInstruction.triggerEventKey ? ` ⚡ ${currentInstruction.triggerEventKey}` : '';
              const label = animation
                ? animation.replace('animations/', '').replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ')
                : 'USE_OBJECT';
              const objPrefix = objName ? `[${objName}${slotInfo}] ` : '';
              const repeatsInfo = targetRepeatsRef.current > 1 ? ` x${targetRepeatsRef.current}` : '';
              appLog(_characterId, `🎭 Action: ${objPrefix}${label}${triggerInfo} (${timerRef.current.toFixed(1)}s${repeatsInfo})`);
            }
          }
        } else {
          statusRef.current = 'IDLE';
          currentWalkAnimRef.current = getRandomNpcWalkAnimation(_characterId);
          advanceToNextStep(hasNavStep);
        }
      } else {
        stateRef.current.y = 0;
        stateRef.current.animation = currentWalkAnimRef.current;

        const dirX = dx / dist;
        const dirZ = dz / dist;

        const { steerX, steerZ } = computeSteeringVector(
          _characterId,
          stateRef.current.x,
          stateRef.current.z,
          dirX,
          dirZ,
          dist,
          currentInstruction.smartObjectId
        );

        const moveDist = Math.min(SPEED * dt, dist);
        stateRef.current.x += steerX * moveDist;
        stateRef.current.z += steerZ * moveDist;

        const targetRot = Math.atan2(steerX, steerZ);
        stateRef.current.rotY = computeRotYStep(stateRef.current.rotY, targetRot, ROT_SPEED, dt);
      }
    } else if (statusRef.current === 'INTERACTING') {
      // ── 5. Interactions (INTERACTING) ──
      if (currentInstruction.smartObjectId === 'duo-zone') {
        const isEnded = handleDuoInteraction({
          characterId: _characterId,
          dt,
          state: stateRef.current,
          duoRole: duoRoleRef.current,
          duoWaitTimer: duoWaitTimerRef.current,
          duoInvited: duoInvitedRef.current,
          onSessionEnded: () => {
            resetDuoState();
            if (!hasNavStep) stepIndexRef.current++;
          },
          setDuoWaitTimer: (t) => { duoWaitTimerRef.current = t; },
          setDuoInvited: (inv) => { duoInvitedRef.current = inv; }
        });

        if (isEnded) {
          return update(dt);
        }
        return stateRef.current;
      }

      if (currentInstruction.type === 'ROTATE_360') {
        const totalDuration = currentInstruction.duration || 5.0;
        const turnSpeed = (2 * Math.PI) / totalDuration;
        stateRef.current.rotY = (stateRef.current.rotY + turnSpeed * dt) % (2 * Math.PI);
        stateRef.current.animation = currentInstruction.animation || 'animations/locomotion/anim_right_turn.glb';

        timerRef.current -= dt;
        if (timerRef.current <= 0) {
          statusRef.current = 'IDLE';
          stepIndexRef.current++;
        }
        return stateRef.current;
      }

      const target = getResolvedCoords(currentInstruction);
      stateRef.current.animation = currentInstruction.animation || target.anim || 'idle';
      if (target.ty !== undefined) stateRef.current.y = target.ty;

      const targetRotY = currentInstruction.rotY !== undefined ? currentInstruction.rotY : target.rotY;
      if (targetRotY !== undefined) {
        stateRef.current.rotY = computeRotYStep(stateRef.current.rotY, targetRotY, ROT_SPEED, dt);
      }

      timerRef.current -= dt;
      if (timerRef.current <= 0) {
        if (repeatIndexRef.current + 1 < targetRepeatsRef.current) {
          repeatIndexRef.current++;
          if (repeatVariationRef.current && currentInstruction.smartObjectId && currentInstruction.slotId) {
            const obj = SMART_OBJECTS[currentInstruction.smartObjectId];
            const slot = obj?.slots?.find(s => s.slotId === currentInstruction.slotId);
            if (slot) {
              const res = resolveSlotAnimation(slot);
              if (res.animation) {
                currentInstruction.animation = res.animation;
                stateRef.current.animation = res.animation;
              }
              if (res.rotY !== undefined) {
                currentInstruction.rotY = res.rotY;
                stateRef.current.rotY = res.rotY;
              }
            }
          }
          const cycleDuration = currentInstruction.duration
            || target.duration
            || getEstimatedClipDuration(currentInstruction.animation || stateRef.current.animation);
          timerRef.current = cycleDuration;
          return stateRef.current;
        }

        repeatIndexRef.current = 0;
        targetRepeatsRef.current = 1;
        statusRef.current = 'IDLE';
        stateRef.current.y = startPosRef.current?.y ?? 0;
        advanceToNextStep(hasNavStep);
      }
    }

    return stateRef.current;
  };

  const setPosition = (x: number, y: number, z: number) => {
    stateRef.current.x = x;
    stateRef.current.y = y;
    stateRef.current.z = z;
  };

  const setRotation = (rotY: number) => {
    stateRef.current.rotY = rotY;
  };

  const hasPendingDynamicTask = () => {
    return dynamicNavQueueRef.current.length > 0 && dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
  };

  return { update, setPosition, setRotation, hasPendingDynamicTask };
}
