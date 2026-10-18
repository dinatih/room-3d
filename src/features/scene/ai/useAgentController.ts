import { useRef, useEffect } from 'react';
import { AgentInstruction } from './aiTypes';
import { SMART_OBJECTS, buildSmartObjectInstructionSequence, getAllSmartObjectIds, isDuoSlot } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';
import { duoSessionManager, DuoRole } from './duoSessionManager';
import { canCharacterPerformDuo, getDuoAnimationForClip } from '../animations/duoAnimations';
import { createRouteState, followRoute, resetRoute, getInteractionOwner, getContainingObjectOwner, getObjectApproach, movePostureExit, NavigationBlockedError, getNavigationGraph, describeNavigationBlock } from './navigation/service';
import { movingFurniture } from '../furniturePositions';
import { hasAgentProfile, getObstacleRevision, getAgentProfile, navigationDebug, furnitureObstacles } from './navigation/obstacles';
import { distance, inflate, pointInRing, BOOLEAN_PRECISION } from './navigation/geometry';
import { useSceneStore } from '../store/useSceneStore';
import { appLog } from '@features/ui/AppConsole';
import { getEstimatedClipDuration } from '../animOptions';
import { resolveAnimationId, getAnimationDef, resolveSlotAnimation } from '../animations/animationResolver';

import { AgentState, AgentStatus } from './agent/agentTypes';
import { cameraState } from '../cameraState';
import { NPC_WALK_ANIMATIONS, getRandomNpcWalkAnimation, getWalkSpeedForAnimation } from './agent/agentWalkAnimations';
import { resolveInstructionCoords } from './agent/agentInstructionCoords';
import { computeSteeringVector, computeRotYStep, isAgentDestinationFree, beginActorBlockCheck, endActorBlockCheck, actorBlocksUnchanged, type ActorBlockers } from './agent/agentAvoidance';
import { handleDuoInteraction } from './agent/agentDuoHandler';
import { getExitTransition } from '../animations/animationTransitions';
import { doorCollisionState } from '../doorObstacles';
import { setDesk2SmartActionState } from '@features/scene/utils/deskScreenVideo';

export type { AgentState };
export { NPC_WALK_ANIMATIONS, getRandomNpcWalkAnimation };

const BLOCKED_ANIMATION = resolveAnimationId('sad-idle');

interface AgentDeploymentState {
  hasStarted: boolean;
  hasLoggedFalling: boolean;
  hasCompleted: boolean;
  status: AgentStatus;
  y: number;
  timer: number;
  delayTimer: number;
}

const agentDeploymentMap = new Map<string, AgentDeploymentState>();

export function resetAgentDeployment(characterId?: string) {
  if (characterId) {
    agentDeploymentMap.delete(characterId);
  } else {
    agentDeploymentMap.clear();
  }
}

export function useAgentController(
  _characterId: string,
  scenario: AgentInstruction[] | null,
  loop: boolean = false,
  getRealPosition: () => { x: number; y: number; z: number; rotY: number },
  onComplete?: () => void,
  spawnDelay: number = 0,
  hasSkyDrop: boolean = false,
  landingAnim: string = 'pistol-kneel-to-stand',
  enabled: boolean = true
) {
  const landingAnimId = resolveAnimationId(landingAnim);
  const landingDuration = getAnimationDef(landingAnimId)?.duration ?? 1.4;
  // Déduire le fondu croisé (0.2s) pour que l'enchaînement vers l'étape suivante s'opère pile à la fin du clip sans rejeu
  const landingPhaseDuration = Math.max(0.1, landingDuration - 0.2);

  const firstCoords = (scenario && scenario.length > 0 && scenario[0].type !== 'OBSERVE_OBJECT') ? resolveInstructionCoords(scenario[0], null) : null;
  const initialPos = (firstCoords && (firstCoords.tx !== 0 || firstCoords.tz !== 0))
    ? { x: firstCoords.tx, y: firstCoords.ty ?? 0, z: firstCoords.tz, rotY: firstCoords.rotY ?? 0 }
    : getRealPosition();

  let deployment = agentDeploymentMap.get(_characterId);
  if (!deployment) {
    const isWaiting = hasSkyDrop && spawnDelay > 0;
    const isFallingImmediately = hasSkyDrop && spawnDelay === 0;
    deployment = {
      hasStarted: isFallingImmediately,
      hasLoggedFalling: false,
      hasCompleted: !hasSkyDrop,
      status: isWaiting ? 'WAITING' : (isFallingImmediately ? 'FALLING' : 'IDLE'),
      y: hasSkyDrop ? 2500 : initialPos.y,
      timer: isFallingImmediately ? 6.0 : 0,
      delayTimer: spawnDelay,
    };
    if (enabled) agentDeploymentMap.set(_characterId, deployment);
  }

  const isStillWaiting = deployment.status === 'WAITING';
  const isCurrentlyFalling = deployment.status === 'FALLING';

  const stateRef = useRef<AgentState>({
    x: initialPos.x,
    y: deployment.y,
    z: initialPos.z,
    rotY: initialPos.rotY,
    animation: isCurrentlyFalling
      ? (deployment.timer <= 3.0 ? 'falling-idle' : 'falling')
      : (firstCoords?.anim ? resolveAnimationId(firstCoords.anim) : 'idle'),
    isSpawned: !isStillWaiting
  });

  const stepIndexRef = useRef(0);
  const timerRef = useRef(deployment.timer);
  const statusRef = useRef<AgentStatus>(deployment.status);
  const playbackRef = useRef<{ animation: string; progress: number; finished: boolean } | null>(null);
  const transitionRef = useRef<{
    animation: string; sourceAnimation: string; y: number; advanceStep: boolean;
    departure: { x: number; z: number }; owner?: string;
    exit?: { x: number; z: number };
  } | null>(null);
  const beginExitTransition = (advanceStep: boolean) => {
    if (!(useSceneStore.getState().layers.exitTransitions ?? false)) return false;
    const exit = getExitTransition(stateRef.current.animation);
    if (!exit) return false;
    const owner = routeRef.current.owner ?? claimedSlotRef.current?.objectId;
    transitionRef.current = {
      animation: exit.anim, sourceAnimation: stateRef.current.animation, y: stateRef.current.y, advanceStep,
      departure: { x: stateRef.current.x, z: stateRef.current.z },
      owner: owner ? getInteractionOwner(owner) : undefined,
    };
    playbackRef.current = null;
    statusRef.current = 'TRANSITIONING';
    return true;
  };
  const delayTimerRef = useRef(deployment.delayTimer);
  const prevScenarioRef = useRef<AgentInstruction[] | null | undefined>(undefined);
  const startPosRef = useRef<{ x: number; y: number; z: number; rotY: number; owner?: string }>(initialPos);
  const claimedSlotRef = useRef<{ objectId: string; slotId: string } | null>(null);

  // Instructions temporaires (actions demandées, rendez-vous et interactions duo).
  const dynamicNavQueueRef = useRef<AgentInstruction[]>([]);
  const dynamicNavIndexRef = useRef(0);
  const routeRef = useRef(createRouteState());
  const routeInstructionRef = useRef<AgentInstruction | null>(null);
  const navigationErrorRef = useRef<string | null>(null);
  const reportNavigationStop = (reason: string, label: string, target: { x: number; z: number }, actorBlockers?: ActorBlockers) => {
    const key = `${label}:${reason}`;
    if (navigationErrorRef.current === key) return;
    navigationErrorRef.current = key;
    const objId = routeInstructionRef.current?.smartObjectId ?? claimedSlotRef.current?.objectId;
    appLog(
      _characterId,
      `🚧 Navigation bloquée vers ${label} : ${reason} — ${describeNavigationBlock(_characterId, stateRef.current, target, routeRef.current, actorBlockers)}`,
      {
        category: 'nav',
        action: 'nav_blocked',
        actors: [_characterId],
        object: objId ? { id: objId, label, slotId: claimedSlotRef.current?.slotId } : undefined,
      }
    );
  };
  const initialProfileResolvedRef = useRef(false);
  const spawnObstacleRevisionRef = useRef(-1);
  const blockedCoordsRef = useRef<{ instruction: AgentInstruction; graph: ReturnType<typeof getNavigationGraph>; x: number; z: number; owner?: string; status: AgentStatus; actorBlockers: ActorBlockers } | null>(null);

  // Animation de marche courante pour les trajets
  const currentWalkAnimRef = useRef<string>(getRandomNpcWalkAnimation(_characterId));

  // Ref pour éviter les logs dupliqués à chaque frame
  const lastLogRef = useRef<string>('');

  // Gestion spécifique du rôle et attente pour la duo-zone
  const duoRoleRef = useRef<DuoRole | null>(null);
  const duoWaitTimerRef = useRef<number>(0);
  const duoInvitedRef = useRef<boolean>(false);
  const lastDuoEndTimeRef = useRef<number>(0);

  // Répétitions d'animation et variations pour SmartObjects
  const repeatIndexRef = useRef<number>(0);
  const targetRepeatsRef = useRef<number>(1);
  const repeatVariationRef = useRef<boolean>(false);

  // Cache de la résolution de l'instruction en cours pour éviter de réallouer / recalculer resolveInstructionCoords à chaque frame
  const cachedCoordsRef = useRef<ReturnType<typeof resolveInstructionCoords> | null>(null);
  const cachedCoordsInstructionRef = useRef<AgentInstruction | null>(null);
  const cachedCoordsRevisionRef = useRef(-1);

  const getResolvedCoords = (instr: AgentInstruction) => {
    const revision = getObstacleRevision();
    const followsInteraction = statusRef.current === 'INTERACTING' && !!instr.smartObjectId && movingFurniture.size > 0;
    const occupiedApproach = (statusRef.current !== 'INTERACTING' || instr.type === 'OBSERVE_OBJECT') && cachedCoordsRef.current && hasAgentProfile(_characterId)
      && !isAgentDestinationFree(_characterId, { x: cachedCoordsRef.current.tx, z: cachedCoordsRef.current.tz });
    if (followsInteraction || occupiedApproach || (!movingFurniture.size && cachedCoordsRevisionRef.current !== revision) || cachedCoordsInstructionRef.current !== instr || !cachedCoordsRef.current) {
      cachedCoordsInstructionRef.current = instr;
      cachedCoordsRevisionRef.current = revision;
      beginActorBlockCheck(_characterId);
      try { cachedCoordsRef.current = resolveInstructionCoords(instr, startPosRef.current, _characterId, stateRef.current, routeRef.current.owner); }
      catch (error) {
        if (error instanceof NavigationBlockedError) error.actorBlockers = endActorBlockCheck(_characterId);
        throw error;
      } finally { endActorBlockCheck(_characterId); }
    }
    return cachedCoordsRef.current;
  };

  useEffect(() => () => resetRoute(routeRef.current, _characterId), [_characterId]);

  const releaseClaimedSlot = () => {
    resetRoute(routeRef.current, _characterId);
    if (claimedSlotRef.current) {
      if (claimedSlotRef.current.objectId === 'desk-bollsidan-2') {
        setDesk2SmartActionState(_characterId, false);
      }
      if (claimedSlotRef.current.objectId === 'cuisine-group' && claimedSlotRef.current.slotId === 'cook-oven') {
        useSceneStore.getState().triggerAction('ninja', false);
      }
      if (claimedSlotRef.current.objectId === 'fridge' || claimedSlotRef.current.objectId === 'freezer') {
        useSceneStore.getState().triggerAction(claimedSlotRef.current.objectId, false);
      }
      if (claimedSlotRef.current.objectId === 'corridor-closet') {
        useSceneStore.getState().triggerAction('corrDoors', false);
      }
      if (claimedSlotRef.current.objectId === 'sdb-closet') {
        useSceneStore.getState().triggerAction('sdbClosetR', false);
        useSceneStore.getState().triggerAction('sdbClosetL', false);
      }
      OccupancyManager.releaseSlot(claimedSlotRef.current.objectId, claimedSlotRef.current.slotId, _characterId);
      claimedSlotRef.current = null;
    }
  };

  // Libérer toutes les réservations au démontage et écouter les invitations de duo
  useEffect(() => {
    if (!enabled) return;
    const onInvite = (e: any) => {
      if (e.detail?.targetId === _characterId) {
        const store = useSceneStore.getState();
        const isFromUI = e.detail?.fromId === 'HoverMenu' || e.detail?.fromId === 'ZoneAiDebug' || e.detail?.fromId === 'Toolbar' || e.detail?.fromId === 'SidePanel' || e.detail?.fromId === 'Inventory';
        if (_characterId === store.activeCharacterId && !isFromUI) {
          return;
        }

        const targetObjId = e.detail?.objectId;
        if (targetObjId && !OccupancyManager.canUseObject(targetObjId, _characterId)) return;
        const role = (e.detail?.forceRole as DuoRole) || 'roleB';
        if (role) {
          duoRoleRef.current = role;
          duoInvitedRef.current = true;
          const targetSlotId = e.detail?.slotId || role;
          if (claimedSlotRef.current && (claimedSlotRef.current.objectId !== targetObjId || claimedSlotRef.current.slotId !== targetSlotId)) {
            releaseClaimedSlot();
          }
          if (targetObjId) {
            claimedSlotRef.current = { objectId: targetObjId, slotId: targetSlotId };
          }

          // Coordonnées précalculées transmises par startDuoOnSmartObject (posA / posB monde)
          const eventTargetPos = e.detail?.targetPos as [number, number, number] | undefined;
          const eventTargetRotY = e.detail?.targetRotY as number | undefined;

          dynamicNavQueueRef.current = [
            { type: 'USE_OBJECT', smartObjectId: targetObjId, slotId: targetSlotId, targetPos: eventTargetPos, rotY: eventTargetRotY }
          ];
          dynamicNavIndexRef.current = 0;
          resetRoute(routeRef.current, _characterId);
          routeInstructionRef.current = null;
          cachedCoordsInstructionRef.current = null;
          cachedCoordsRef.current = null;

          if (!deployment.hasCompleted) {
            appLog(_characterId, `🪂 Invitation duo en attente de l'atterrissage`, {
              category: 'duo',
              action: 'duo_invite_wait_landing',
              actors: [_characterId],
              object: targetObjId ? { id: targetObjId, slotId: targetSlotId } : undefined,
            });
            return;
          }
          if (e.detail?.alreadyThere) {
            statusRef.current = 'INTERACTING';
            duoSessionManager.markReady(_characterId);
            const animState = duoSessionManager.getCurrentAnimState(_characterId);
            if (animState) {
              stateRef.current.animation = role === 'roleA' ? animState.clipA : animState.clipB;
            }
          } else {
            statusRef.current = 'IDLE';
            beginExitTransition(false);
            const locName = targetObjId ? (SMART_OBJECTS[targetObjId]?.name || targetObjId) : 'le point duo';
            appLog(_characterId, `🏃‍♂️ Répond à l'appel de ${e.detail.fromId} (${role === 'roleA' ? 'Meneur' : 'Partenaire'}) et rejoint ${locName} !`, {
              category: 'duo',
              action: 'duo_accept_invite',
              actors: [_characterId],
              object: targetObjId ? { id: targetObjId, label: locName, slotId: targetSlotId } : undefined,
            });
          }
        }
      }
    };

    const onForceSmartObject = (e: any) => {
      if (e.detail?.targetId === _characterId && e.detail?.objectId) {
        const { objectId, slotId, animation } = e.detail;
        if (!OccupancyManager.canUseObject(objectId, _characterId)) {
          appLog(_characterId, `⚠️ Accès refusé : ${SMART_OBJECTS[objectId]?.name ?? objectId} est réservé à ${SMART_OBJECTS[objectId]?.ownerCharacterId}`, {
            category: 'object',
            action: 'access_denied',
            actors: [_characterId],
            object: { id: objectId, label: SMART_OBJECTS[objectId]?.name, slotId },
          });
          return;
        }
        const targetSlot = slotId || SMART_OBJECTS[objectId]?.slots[0]?.slotId;
        if (targetSlot && OccupancyManager.isSlotOccupied(objectId, targetSlot, _characterId)) {
          const occupant = OccupancyManager.getOccupant(objectId, targetSlot);
          appLog(_characterId, `⚠️ Action impossible : ${SMART_OBJECTS[objectId]?.name || objectId} est déjà occupé${occupant ? ` (${occupant})` : ''}`, {
            category: 'object',
            action: 'slot_occupied',
            actors: [_characterId],
            object: { id: objectId, label: SMART_OBJECTS[objectId]?.name, slotId: targetSlot },
          });
          return;
        }

        releaseClaimedSlot();
        duoSessionManager.leaveDuoZone(_characterId);
        duoRoleRef.current = null;
        duoInvitedRef.current = false;

        const seq = buildSmartObjectInstructionSequence(objectId, slotId, _characterId);
        if (seq && seq.length > 0) {
          if (animation) {
            const useStep = seq.find((s) => s.type === 'USE_OBJECT');
            if (useStep) {
              useStep.animation = animation;
              const def = getAnimationDef(animation);
              if (def?.duration) {
                useStep.duration = def.duration;
              }
            }
          }
          if (targetSlot) {
            OccupancyManager.claimSlot(objectId, targetSlot, _characterId);
            claimedSlotRef.current = { objectId, slotId: targetSlot };
          }
          dynamicNavQueueRef.current = seq;
          dynamicNavIndexRef.current = 0;
          resetRoute(routeRef.current, _characterId);
          routeInstructionRef.current = null;
          if (deployment.hasCompleted) {
            statusRef.current = 'IDLE';
            beginExitTransition(false);
          }
          cachedCoordsInstructionRef.current = null;
          cachedCoordsRef.current = null;
          const resolvedAnimId = animation ? resolveAnimationId(animation) : undefined;
          appLog(_characterId, `⚡ Ordre direct reçu : ${objectId}${slotId ? ` (${slotId})` : ''}${animation ? ` [${animation}]` : ''}`, {
            category: 'object',
            action: 'direct_order',
            actors: [_characterId],
            object: { id: objectId, label: SMART_OBJECTS[objectId]?.name, slotId: targetSlot },
            animation: resolvedAnimId ? { id: resolvedAnimId, mode: 'solo', label: getAnimationDef(resolvedAnimId)?.label, actorId: _characterId } : undefined,
          });
        }
      }
    };

    const onRetrySmartAction = (event: Event) => {
      const { targetId, objectId } = (event as CustomEvent<{ targetId: string; objectId: string }>).detail;
      if (targetId === _characterId) retrySmartAction(objectId);
    };
    document.addEventListener('npc-retry-smartaction', onRetrySmartAction);
    document.addEventListener('npc-invite-duo', onInvite);
    document.addEventListener('agent-force-smartobject', onForceSmartObject);
    return () => {
      document.removeEventListener('npc-retry-smartaction', onRetrySmartAction);
      document.removeEventListener('npc-invite-duo', onInvite);
      document.removeEventListener('agent-force-smartobject', onForceSmartObject);
      releaseClaimedSlot();
      OccupancyManager.releaseAllForCharacter(_characterId);
      duoSessionManager.leaveDuoZone(_characterId);
      setDesk2SmartActionState(_characterId, false);
    };
  }, [_characterId, enabled]);

  if (scenario !== prevScenarioRef.current) {
    const previousAnimation = stateRef.current.animation;
    const previousTransition = transitionRef.current;
    const departureOwner = routeRef.current.owner ?? claimedSlotRef.current?.objectId
      ?? (hasAgentProfile(_characterId) ? getContainingObjectOwner(_characterId, getRealPosition()) : undefined);
    if (claimedSlotRef.current) {
      releaseClaimedSlot();
      OccupancyManager.releaseAllForCharacter(_characterId);
      duoSessionManager.leaveDuoZone(_characterId);
      setDesk2SmartActionState(_characterId, false);
      claimedSlotRef.current = null;
      duoRoleRef.current = null;
      duoInvitedRef.current = false;
    }
    // SkyDrop n'est initialisé que si le personnage n'a pas encore démarré son déploiement
    const shouldSkyDrop = hasSkyDrop && !deployment.hasStarted;
    const isWait = shouldSkyDrop && spawnDelay > 0;
    const isFallNow = shouldSkyDrop && spawnDelay === 0;

    stepIndexRef.current = 0;
    repeatIndexRef.current = 0;
    targetRepeatsRef.current = 1;

    if (shouldSkyDrop) {
      timerRef.current = isFallNow ? 6.0 : 0;
      statusRef.current = isWait ? 'WAITING' : (isFallNow ? 'FALLING' : 'IDLE');
      delayTimerRef.current = spawnDelay;
      deployment.status = statusRef.current;
      deployment.timer = timerRef.current;
      deployment.delayTimer = spawnDelay;
      if (isFallNow) {
        deployment.hasStarted = true;
      }
    } else {
      statusRef.current = deployment.hasCompleted ? 'IDLE' : deployment.status;
      timerRef.current = deployment.hasCompleted ? 0 : deployment.timer;
      delayTimerRef.current = deployment.delayTimer;
    }

    const firstScenario = prevScenarioRef.current === undefined;
    prevScenarioRef.current = scenario;
    dynamicNavQueueRef.current = [];
    dynamicNavIndexRef.current = 0;
    resetRoute(routeRef.current, _characterId);
    routeRef.current.owner = departureOwner;
    routeInstructionRef.current = null;
    cachedCoordsInstructionRef.current = null;
    cachedCoordsRef.current = null;

    if (scenario) {
      const stepCoords = firstScenario && scenario.length > 0 && scenario[0].type !== 'OBSERVE_OBJECT'
        ? resolveInstructionCoords(scenario[0], null) : null;
      const real = (stepCoords && (stepCoords.tx !== 0 || stepCoords.tz !== 0))
        ? { x: stepCoords.tx, y: stepCoords.ty ?? 0, z: stepCoords.tz, rotY: stepCoords.rotY ?? 0 }
        : getRealPosition();

      stateRef.current.x = real.x;
      stateRef.current.y = deployment.hasCompleted ? real.y : deployment.y;
      stateRef.current.z = real.z;
      stateRef.current.rotY = real.rotY;
      stateRef.current.isSpawned = deployment.status !== 'WAITING';
      stateRef.current.animation = deployment.status === 'FALLING'
        ? (deployment.timer <= 3.0 ? 'falling-idle' : 'falling')
        : (deployment.status === 'WAITING' ? 'idle' : (stepCoords?.anim ? resolveAnimationId(stepCoords.anim) : 'idle'));
      startPosRef.current = { x: real.x, y: real.y, z: real.z, rotY: real.rotY, owner: departureOwner };
    }
    if (!firstScenario && deployment.hasCompleted) {
      stateRef.current.animation = previousAnimation;
      if (previousTransition) {
        previousTransition.advanceStep = false;
        statusRef.current = 'TRANSITIONING';
      } else {
        beginExitTransition(false);
      }
    }
  }

  const ROT_SPEED = 5;

  const triggerInstructionEvent = (instruction: AgentInstruction) => {
    if (!instruction.triggerEventKey) return;
    useSceneStore.getState().triggerAction(instruction.triggerEventKey, instruction.triggerEventValue);
  };

  const advanceToNextStep = (hasNavStep: boolean) => {
    const next = hasNavStep ? dynamicNavQueueRef.current[dynamicNavIndexRef.current + 1] ?? scenario?.[stepIndexRef.current] : scenario?.[stepIndexRef.current + 1];
    resetRoute(routeRef.current, _characterId, next?.closedDoor);
    routeInstructionRef.current = null;
    cachedCoordsInstructionRef.current = null;
    cachedCoordsRef.current = null;
    if (hasNavStep) {
      dynamicNavIndexRef.current++;
      if (dynamicNavIndexRef.current >= dynamicNavQueueRef.current.length) {
        dynamicNavQueueRef.current = [];
        dynamicNavIndexRef.current = 0;
        const nextInstr = scenario && stepIndexRef.current < scenario.length ? scenario[stepIndexRef.current] : null;
        if (claimedSlotRef.current && (!nextInstr || nextInstr.smartObjectId !== claimedSlotRef.current.objectId || (nextInstr.slotId && nextInstr.slotId !== claimedSlotRef.current.slotId))) {
          releaseClaimedSlot();
        }
      } else {
        const nextDynamicInstr = dynamicNavQueueRef.current[dynamicNavIndexRef.current];
        if (claimedSlotRef.current && nextDynamicInstr?.smartObjectId && (nextDynamicInstr.smartObjectId !== claimedSlotRef.current.objectId || (nextDynamicInstr.slotId && nextDynamicInstr.slotId !== claimedSlotRef.current.slotId))) {
          releaseClaimedSlot();
        }
      }
    } else {
      stepIndexRef.current++;
      const nextInstr = scenario && stepIndexRef.current < scenario.length ? scenario[stepIndexRef.current] : null;
      if (claimedSlotRef.current && (!nextInstr || nextInstr.smartObjectId !== claimedSlotRef.current.objectId || (nextInstr.slotId && nextInstr.slotId !== claimedSlotRef.current.slotId))) {
        releaseClaimedSlot();
      }
    }
  };

  const resetDuoState = () => {
    duoSessionManager.leaveDuoZone(_characterId);
    releaseClaimedSlot();
    duoRoleRef.current = null;
    duoInvitedRef.current = false;
    dynamicNavQueueRef.current = [];
    dynamicNavIndexRef.current = 0;
    cachedCoordsInstructionRef.current = null;
    cachedCoordsRef.current = null;
    statusRef.current = 'IDLE';
  };

  const retrySmartAction = (objectId: string) => {
    const departureOwner = routeRef.current.owner;
    const session = duoSessionManager.getSessionFor(_characterId);
    const partners = [session?.participantA?.characterId, session?.participantB?.characterId]
      .filter((id): id is string => !!id && id !== _characterId);
    // Leaving as the leader closes the whole session, even before either arrival.
    duoSessionManager.leaveDuoZone(session?.participantA?.characterId ?? _characterId);
    resetDuoState();
    OccupancyManager.releaseAllForCharacter(_characterId);
    routeRef.current.owner = departureOwner;
    routeInstructionRef.current = null;
    blockedCoordsRef.current = null;
    navigationErrorRef.current = null;
    timerRef.current = 0;
    duoWaitTimerRef.current = 0;
    repeatIndexRef.current = 0;
    targetRepeatsRef.current = 1;
    stateRef.current.animation = 'idle';
    // Skip the remaining steps of the failed action, including its exit steps.
    while (scenario?.[stepIndexRef.current]?.smartObjectId === objectId) stepIndexRef.current++;
    const candidates = getAllSmartObjectIds().filter(id => id !== objectId)
      .map(id => buildSmartObjectInstructionSequence(id, undefined, _characterId))
      .filter(sequence => sequence.length > 0);
    dynamicNavQueueRef.current = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : [];
    appLog(_characterId, `🎲 Action abandonnée (${objectId}), nouveau tirage d'une smartaction${candidates.length ? '' : ' : aucune disponible'}`, {
      category: 'object',
      action: 'retry_smartaction',
      actors: [_characterId],
      object: { id: objectId, label: SMART_OBJECTS[objectId]?.name },
    });
    for (const targetId of partners) {
      document.dispatchEvent(new CustomEvent('npc-retry-smartaction', { detail: { targetId, objectId } }));
    }
  };

  // Process instruction changes on the next frame. Recursive retries can loop
  // forever within one frame when every object in a looping scenario is busy.
  const advance = (dt: number): AgentState => {
    const landingThisFrame = statusRef.current === 'FALLING' && timerRef.current <= dt && cameraState.isSceneLaunched;
    const changedLanding = !deployment.hasCompleted && (spawnObstacleRevisionRef.current !== getObstacleRevision() || landingThisFrame);
    if ((!initialProfileResolvedRef.current || changedLanding) && enabled && hasAgentProfile(_characterId)) {
      cachedCoordsRef.current = null;
      if (scenario?.length && scenario[0].type !== 'OBSERVE_OBJECT') {
        const first = resolveInstructionCoords(scenario[0], null, _characterId);
        if (first.tx !== 0 || first.tz !== 0) {
          stateRef.current.x = first.tx;
          stateRef.current.z = first.tz;
          if (statusRef.current !== 'WAITING' && statusRef.current !== 'FALLING') {
            stateRef.current.y = first.ty ?? 0;
            deployment.y = stateRef.current.y;
          }
          startPosRef.current = { ...stateRef.current, y: first.ty ?? 0 };
          const owner = first.owner ?? scenario[0].smartObjectId;
          routeRef.current.owner = owner ? getInteractionOwner(owner) : undefined;
        }
      }
      initialProfileResolvedRef.current = true;
      spawnObstacleRevisionRef.current = getObstacleRevision();
    }
    const hasNavStepInUpdate = dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
    if (!scenario && !hasNavStepInUpdate && !transitionRef.current) {
      stateRef.current.animation = 'idle';
      return stateRef.current;
    }

    // ── 1. Gestion SkyDrop (Spawn / Chute / Atterrissage) ──
    if (statusRef.current === 'WAITING' || statusRef.current === 'FALLING') {
      if (!cameraState.isSceneLaunched) {
        stateRef.current.animation = statusRef.current === 'FALLING' ? 'falling' : 'idle';
        return stateRef.current;
      }
    }

    if (statusRef.current === 'WAITING') {
      delayTimerRef.current -= dt;
      deployment.delayTimer = delayTimerRef.current;
      if (delayTimerRef.current <= 0) {
        statusRef.current = 'FALLING';
        timerRef.current = 6.0;
        stateRef.current.isSpawned = true;
        deployment.status = 'FALLING';
        deployment.timer = 6.0;
        deployment.hasStarted = true;
      }
      stateRef.current.animation = 'idle';
      return stateRef.current;
    }

    if (statusRef.current === 'FALLING') {
      if (!deployment.hasLoggedFalling) {
        deployment.hasLoggedFalling = true;
        appLog(_characterId, `🪂 Déploiement : Tombée du ciel en parachute`, {
          category: 'nav',
          action: 'deploy_fall',
          actors: [_characterId],
          animation: { id: 'falling', mode: 'solo', actorId: _characterId },
        });
      }
      timerRef.current -= dt;
      deployment.timer = timerRef.current;
      if (timerRef.current <= 0) {
        stateRef.current.y = startPosRef.current?.y ?? 0;
        statusRef.current = 'LANDING';
        timerRef.current = landingPhaseDuration;
        deployment.status = 'LANDING';
        deployment.timer = landingPhaseDuration;
        deployment.y = stateRef.current.y;
        stateRef.current.animation = landingAnimId;
        return stateRef.current;
      } else {
        const p_inv = timerRef.current / 6.0;
        const targetY = startPosRef.current?.y ?? 0;
        stateRef.current.y = targetY + (2500 - targetY) * (p_inv * p_inv * p_inv);
        deployment.y = stateRef.current.y;
        stateRef.current.animation = timerRef.current <= 3.0 ? 'falling-idle' : 'falling';
        return stateRef.current;
      }
    }

    if (statusRef.current === 'LANDING') {
      timerRef.current -= dt;
      deployment.timer = timerRef.current;
      if (timerRef.current <= 0) {
        statusRef.current = 'IDLE';
        deployment.status = 'IDLE';
        deployment.hasCompleted = true;
        appLog(_characterId, `🎯 Déploiement terminé (Atterrissage réussi)`, {
          category: 'nav',
          action: 'deploy_landed',
          actors: [_characterId],
          animation: { id: landingAnimId, mode: 'solo', actorId: _characterId },
        });
      } else {
        stateRef.current.animation = landingAnimId;
        return stateRef.current;
      }
    }

    // A replacement order must finish the rise without consuming its first step.
    if (transitionRef.current && statusRef.current !== 'TRANSITIONING') {
      transitionRef.current.advanceStep = false;
      statusRef.current = 'TRANSITIONING';
      stateRef.current.animation = transitionRef.current.animation;
    }
    // ── 1.5 Gestion des transitions in-between (ex: sit-to-stand, crouch-to-stand, stand-up) ──
    if (statusRef.current === 'TRANSITIONING') {
      const transition = transitionRef.current;
      if (!transition) throw new Error('Missing active posture transition');
      if (transition.owner && !transition.exit && hasAgentProfile(_characterId)) {
        const profile = getAgentProfile(_characterId);
        const direction = { x: Math.sin(stateRef.current.rotY), z: Math.cos(stateRef.current.rotY) };
        const owned = [...furnitureObstacles.values()].filter(obstacle => obstacle.owner === transition.owner
          && obstacle.yMin < profile.height && obstacle.yMax > 0);
        if (owned.some(obstacle => pointInRing(transition.departure, inflate(obstacle.polygon, profile.radius)))) {
          // Aim past the front boundary with the actor's actual body clearance.
          const reach = Math.max(...owned.flatMap(obstacle => obstacle.polygon.map(point =>
            (point.x - transition.departure.x) * direction.x + (point.z - transition.departure.z) * direction.z))) + profile.radius;
          const goal = { x: transition.departure.x + direction.x * reach, z: transition.departure.z + direction.z * reach };
          const exit = getObjectApproach(transition.owner, goal, _characterId, stateRef.current, true);
          if (!exit) {
            stateRef.current.animation = transition.sourceAnimation;
            stateRef.current.animationPaused = true;
            reportNavigationStop(`Aucune sortie praticable de ${transition.owner}`, transition.owner, goal);
            return stateRef.current;
          }
          transition.exit = exit;
          routeRef.current.owner = transition.owner;
        }
      }
      const playback = playbackRef.current;
      stateRef.current.animation = transition.animation;
      stateRef.current.animationPaused = false;
      if (playback?.animation === transition.animation) {
        if (transition.exit) {
          const target = {
            x: transition.departure.x + (transition.exit.x - transition.departure.x) * playback.progress,
            z: transition.departure.z + (transition.exit.z - transition.departure.z) * playback.progress,
          };
          const previous = { x: stateRef.current.x, z: stateRef.current.z };
          const next = movePostureExit(routeRef.current, _characterId, previous, target, transition.owner!);
          stateRef.current.x = next.x;
          stateRef.current.z = next.z;
          stateRef.current.animationPaused = distance(next, target) > BOOLEAN_PRECISION;
          if (stateRef.current.animationPaused && (routeRef.current.error || routeRef.current.waitReason)) {
            reportNavigationStop(routeRef.current.error ?? routeRef.current.waitReason!, transition.owner ?? 'sortie de posture', transition.exit);
          }
        }
        stateRef.current.y = transition.y * (1 - playback.progress);
      }
      if (playback?.animation === transition.animation && playback.finished && !stateRef.current.animationPaused) {
        transitionRef.current = null;
        statusRef.current = 'IDLE';
        stateRef.current.animation = resolveAnimationId('idle');
        if (transition.advanceStep) {
          advanceToNextStep(hasNavStepInUpdate);
          // Bed routines also describe an explicit edge/floor departure. The
          // animation-driven exit has already completed those steps.
          if (transition.exit) {
            let dynamic = dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
            let next = dynamic ? dynamicNavQueueRef.current[dynamicNavIndexRef.current] : scenario?.[stepIndexRef.current];
            while (next?.postureExit) {
              advanceToNextStep(dynamic);
              dynamic = dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
              next = dynamic ? dynamicNavQueueRef.current[dynamicNavIndexRef.current] : scenario?.[stepIndexRef.current];
            }
          }
        }
      }
      return stateRef.current;
    }

    const scenarioLength = scenario ? scenario.length : 0;

    // ── 2. Fin de scénario / Bouclage ──
    if (stepIndexRef.current >= scenarioLength && dynamicNavQueueRef.current.length === 0) {
      releaseClaimedSlot();
      if (loop && scenarioLength > 0) {
        stepIndexRef.current = 0;
        resetRoute(routeRef.current, _characterId);
        routeInstructionRef.current = null;
        cachedCoordsInstructionRef.current = null;
        cachedCoordsRef.current = null;
        const loopKey = `loop-${_characterId}`;
        if (lastLogRef.current !== loopKey) {
          lastLogRef.current = loopKey;
          appLog(_characterId, '🔄 Nouveau cycle d\'activité autonome', {
            category: 'nav',
            action: 'cycle_restart',
            actors: [_characterId],
          });
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

    if (currentInstruction.doorKey) {
      const closed = doorCollisionState[currentInstruction.doorKey].angle === 0;
      if (currentInstruction.type === 'WAIT' && closed) {
        advanceToNextStep(hasNavStep);
        return stateRef.current;
      }
      if (currentInstruction.type === 'WAIT') {
        stateRef.current.animation = 'idle';
        return stateRef.current;
      }
    }

    // ── 3. État IDLE : Initialisation et réservation de l'instruction ──
    if (statusRef.current === 'IDLE') {
      if (currentInstruction.smartObjectId && currentInstruction.type !== 'OBSERVE_OBJECT') {
        if (!OccupancyManager.canUseObject(currentInstruction.smartObjectId, _characterId)) {
          throw new Error(`Access denied to ${currentInstruction.smartObjectId} for ${_characterId}`);
        }
        const objId = currentInstruction.smartObjectId;
        let reqSlotId = currentInstruction.slotId || SMART_OBJECTS[objId]?.slots[0]?.slotId || 'default';
        const isDuo = isDuoSlot(objId, reqSlotId);
        if (isDuo) {
          let role = duoRoleRef.current;
          if (!role) {
            const duoRes = duoSessionManager.startDuoSession(objId, reqSlotId, _characterId);
            if ((!duoRes && _characterId === 'xbot') || (duoRes && duoRes.targetA !== _characterId && duoRes.targetB !== _characterId)) {
              statusRef.current = 'IDLE';
              stateRef.current.animation = 'idle';
              releaseClaimedSlot();
              advanceToNextStep(hasNavStep);
              return stateRef.current;
            }
            if (duoRes) {
              if (duoRes.targetB === _characterId) {
                role = 'roleB';
                duoRoleRef.current = 'roleB';
                currentInstruction.targetPos = duoRes.posB;
                currentInstruction.slotId = `${duoRes.actualSlotId}:roleB`;
                currentInstruction.rotY = duoRes.rotB;
                claimedSlotRef.current = { objectId: objId, slotId: `${duoRes.actualSlotId}:roleB` };
              } else if (duoRes.targetA === _characterId) {
                role = 'roleA';
                duoRoleRef.current = 'roleA';
                currentInstruction.targetPos = duoRes.posA;
                currentInstruction.slotId = `${duoRes.actualSlotId}:roleA`;
                currentInstruction.rotY = duoRes.rotA;
                claimedSlotRef.current = { objectId: objId, slotId: `${duoRes.actualSlotId}:${duoRoleRef.current}` };
              }
              // Invalider le cache de coords pour forcer le recalcul avec targetPos
              cachedCoordsInstructionRef.current = null;
              cachedCoordsRef.current = null;
            }
            if (role) duoRoleRef.current = role;
          }
          if (role) {
            duoRoleRef.current = role;
            if (!claimedSlotRef.current) {
              // Fallback si le claimedSlot n'a pas été défini ci-dessus (ex: roleA via onInvite)
              currentInstruction.slotId = reqSlotId || role;
              claimedSlotRef.current = { objectId: objId, slotId: currentInstruction.slotId };
            }
          } else if (loop && scenario) {
            while (stepIndexRef.current < scenario.length && scenario[stepIndexRef.current].smartObjectId === objId) {
              stepIndexRef.current++;
            }
            dynamicNavQueueRef.current = [];
            dynamicNavIndexRef.current = 0;
            cachedCoordsInstructionRef.current = null;
            cachedCoordsRef.current = null;
            return stateRef.current;
          }
        } else if (claimedSlotRef.current?.objectId !== objId || (currentInstruction.slotId && claimedSlotRef.current?.slotId !== reqSlotId)) {
          if (claimedSlotRef.current && (claimedSlotRef.current.objectId !== objId || claimedSlotRef.current.slotId !== reqSlotId)) {
            releaseClaimedSlot();
          }
          if (OccupancyManager.isSlotOccupied(objId, reqSlotId, _characterId)) {
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
              cachedCoordsInstructionRef.current = null;
              cachedCoordsRef.current = null;
              if (currentInstruction.type === 'MOVE_TO') {
                // A different action can require a different approach and bed
                // climb. Replace the whole routine, including its exit steps.
                const queue = hasNavStep ? dynamicNavQueueRef.current : scenario;
                if (!queue) throw new Error(`Missing instruction queue for ${objId}`);
                const index = hasNavStep ? dynamicNavIndexRef.current : stepIndexRef.current;
                let end = index;
                while (end < queue.length && queue[end].smartObjectId === objId) end++;
                queue.splice(index, end - index, ...buildSmartObjectInstructionSequence(objId, altSlotId, _characterId));
                resetRoute(routeRef.current, _characterId);
                return stateRef.current;
              }
            } else {
              const occupant = OccupancyManager.getOccupant(objId, reqSlotId);
              const objName = SMART_OBJECTS[objId]?.name || objId;

              if (hasNavStep) {
                appLog(_characterId, `⚠️ ${objName} est occupé${occupant ? ` (${occupant})` : ''}, action ignorée`, {
                  category: 'object',
                  action: 'slot_occupied',
                  actors: [_characterId],
                  object: { id: objId, label: objName, slotId: reqSlotId },
                });
                while (dynamicNavIndexRef.current < dynamicNavQueueRef.current.length &&
                       dynamicNavQueueRef.current[dynamicNavIndexRef.current].smartObjectId === objId) {
                  dynamicNavIndexRef.current++;
                }
                if (dynamicNavIndexRef.current >= dynamicNavQueueRef.current.length) {
                  dynamicNavQueueRef.current = [];
                  dynamicNavIndexRef.current = 0;
                }
                resetRoute(routeRef.current, _characterId);
                cachedCoordsInstructionRef.current = null;
                cachedCoordsRef.current = null;
                return stateRef.current;
              } else if (scenario) {
                appLog(_characterId, `⚠️ ${objName} est occupé${occupant ? ` (${occupant})` : ''}, recherche d'une autre place...`, {
                  category: 'object',
                  action: 'slot_occupied',
                  actors: [_characterId],
                  object: { id: objId, label: objName, slotId: reqSlotId },
                });
                while (stepIndexRef.current < scenario.length && scenario[stepIndexRef.current].smartObjectId === objId) {
                  stepIndexRef.current++;
                }
                dynamicNavQueueRef.current = [];
                dynamicNavIndexRef.current = 0;
                resetRoute(routeRef.current, _characterId);
                cachedCoordsInstructionRef.current = null;
                cachedCoordsRef.current = null;
                return stateRef.current;
              } else {
                appLog(_characterId, `⚠️ ${objName} est actuellement occupé${occupant ? ` (${occupant})` : ''}`, {
                  category: 'object',
                  action: 'slot_occupied',
                  actors: [_characterId],
                  object: { id: objId, label: objName, slotId: reqSlotId },
                });
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
        } else if (!currentInstruction.animation) {
          const targetSlotId = reqSlotId || claimedSlotRef.current?.slotId;
          const chosenSlot = SMART_OBJECTS[objId]?.slots.find(s => s.slotId === targetSlotId);
          if (chosenSlot) {
            const resolved = resolveSlotAnimation(chosenSlot);
            currentInstruction.animation = resolved.animation;
            if (chosenSlot.duration && !currentInstruction.duration) currentInstruction.duration = chosenSlot.duration;
            if (currentInstruction.rotY === undefined) currentInstruction.rotY = resolved.rotY;
          }
        }
      }

      if (currentInstruction.type === 'MOVE_TO' || currentInstruction.type === 'RETURN_TO_START' || currentInstruction.type === 'USE_OBJECT' || currentInstruction.type === 'OBSERVE_OBJECT') {
        const target = getResolvedCoords(currentInstruction);

        statusRef.current = 'MOVING';
        stateRef.current.animation = currentWalkAnimRef.current;
        const logKey = `move-${stepIndexRef.current}-${dynamicNavIndexRef.current}-${target.label}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          const walkAnimId = resolveAnimationId(currentWalkAnimRef.current || 'walk');
          const walkAnimDef = getAnimationDef(walkAnimId);
          const animName = walkAnimDef?.label || (currentWalkAnimRef.current || 'walk')
            .split('/').pop()?.replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ') || 'walk';
          const objId = currentInstruction.smartObjectId;
          appLog(_characterId, `🚶‍♂️ Marche vers ${target.label} (${target.tx.toFixed(0)}, ${target.tz.toFixed(0)}) [${animName}]`, {
            category: 'nav',
            action: 'walk_to',
            actors: [_characterId],
            animation: { id: walkAnimDef?.id ?? walkAnimId, mode: 'solo', label: animName, actorId: _characterId },
            object: objId ? { id: objId, label: SMART_OBJECTS[objId]?.name || target.label, slotId: currentInstruction.slotId } : undefined,
          });
        }
      } else if (currentInstruction.type === 'INTERACT' || currentInstruction.type === 'WAIT') {
        if (currentInstruction.triggerEventKey) {
          triggerInstructionEvent(currentInstruction);
        }

        statusRef.current = 'INTERACTING';
        if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
          setDesk2SmartActionState(_characterId, true);
        }
        const target = getResolvedCoords(currentInstruction);
        if (!currentInstruction.animation && target.anim) currentInstruction.animation = target.anim;
        if (currentInstruction.rotY === undefined && target.rotY !== undefined) currentInstruction.rotY = target.rotY;
        if (!currentInstruction.duration && target.duration) currentInstruction.duration = target.duration;
        timerRef.current = currentInstruction.duration || target.duration || 1.0;
        const resolvedAnimId = resolveAnimationId(currentInstruction.animation || target.anim || 'idle');
        stateRef.current.animation = resolvedAnimId;

        const animation = currentInstruction.animation || target.anim || '';
        const objId = currentInstruction.smartObjectId;
        const objName = objId ? (SMART_OBJECTS[objId]?.name || objId) : '';
        const logKey = `interact-${stepIndexRef.current}-${dynamicNavIndexRef.current}-${animation}-${objName}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          const slotInfo = currentInstruction.slotId ? ` (slot ${currentInstruction.slotId})` : '';
          const triggerInfo = currentInstruction.triggerEventKey ? ` ⚡ ${currentInstruction.triggerEventKey}` : '';
          const animDef = getAnimationDef(resolvedAnimId);
          const label = animDef?.label || (animation
            ? animation.replace('animations/', '').replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ')
            : currentInstruction.type);
          const objPrefix = objName ? `[${objName}${slotInfo}] ` : '';
          appLog(_characterId, `🎭 Action: ${objPrefix}${label}${triggerInfo} (${timerRef.current.toFixed(1)}s)`, {
            category: objId ? 'object' : 'anim',
            action: 'interact',
            actors: [_characterId],
            animation: { id: animDef?.id ?? resolvedAnimId, mode: 'solo', label, actorId: _characterId },
            object: objId ? { id: objId, label: objName, slotId: currentInstruction.slotId } : undefined,
          });
        }
      } else if (currentInstruction.type === 'ROTATE_360') {
        statusRef.current = 'INTERACTING';
        const duration = currentInstruction.duration || 5.0;
        timerRef.current = duration;
        const resolvedAnimId = resolveAnimationId(currentInstruction.animation || 'idle');
        stateRef.current.animation = resolvedAnimId;
        const logKey = `rotate360-${stepIndexRef.current}-${dynamicNavIndexRef.current}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          appLog(_characterId, `🔄 Inspection 360° en cours (${duration.toFixed(1)}s)`, {
            category: 'anim',
            action: 'rotate_360',
            actors: [_characterId],
            animation: { id: resolvedAnimId, mode: 'solo', actorId: _characterId },
          });
        }
      }
    }

    // ── 4. Déplacement (MOVING) ──
    if (statusRef.current === 'MOVING' || statusRef.current === 'BLOCKED') {
      const target = getResolvedCoords(currentInstruction);

      if (!hasAgentProfile(_characterId)) return stateRef.current;
      if (routeInstructionRef.current !== currentInstruction) {
        resetRoute(routeRef.current, _characterId, currentInstruction.closedDoor);
        routeInstructionRef.current = currentInstruction;
        navigationErrorRef.current = null;
      }
      const isDuoAction = isDuoSlot(currentInstruction.smartObjectId, currentInstruction.slotId) || !!duoRoleRef.current;
      const speed = getWalkSpeedForAnimation(currentWalkAnimRef.current);
      const oldPosition = { x: stateRef.current.x, z: stateRef.current.z };
      const position = followRoute(routeRef.current, _characterId, oldPosition, { x: target.tx, z: target.tz }, speed * dt,
        (direction, remaining) => {
          const steering = computeSteeringVector(_characterId, oldPosition.x, oldPosition.z, direction.x, direction.z, remaining);
          return { x: steering.steerX, z: steering.steerZ };
        }, target.owner ?? currentInstruction.smartObjectId, currentInstruction.type === 'USE_OBJECT' || currentInstruction.navigation === 'interaction'
          || (currentInstruction.type === 'RETURN_TO_START' && Boolean(target.owner)), currentInstruction.closedDoor);
      stateRef.current.x = position.x;
      stateRef.current.z = position.z;
      const moved = distance(oldPosition, position);
      if (currentInstruction.navigation === 'interaction' && target.ty !== undefined && moved > 0) {
        const remaining = distance(oldPosition, { x: target.tx, z: target.tz });
        stateRef.current.y += (target.ty - stateRef.current.y) * Math.min(1, moved / remaining);
      }
      if (moved > 0) stateRef.current.rotY = computeRotYStep(stateRef.current.rotY, Math.atan2(position.x - oldPosition.x, position.z - oldPosition.z), ROT_SPEED, dt);
      if (routeRef.current.error) {
        stateRef.current.animation = BLOCKED_ANIMATION;
        statusRef.current = 'BLOCKED';
        reportNavigationStop(routeRef.current.error, target.label, { x: target.tx, z: target.tz });
        if (currentInstruction.smartObjectId) retrySmartAction(currentInstruction.smartObjectId);
        return stateRef.current;
      }
      if (moved === 0 && routeRef.current.search?.job.status === 'pending') {
        stateRef.current.animation = 'idle';
        statusRef.current = 'MOVING';
        return stateRef.current;
      }
      if (moved === 0 && dt > 0 && distance(position, { x: target.tx, z: target.tz }) >= 1e-6) {
        reportNavigationStop(routeRef.current.waitReason ?? 'Aucun déplacement produit par le suivi du trajet (cause non identifiée)', target.label, { x: target.tx, z: target.tz });
      } else if (moved > 0 && navigationErrorRef.current) {
        const objId = currentInstruction.smartObjectId;
        appLog(_characterId, `✅ Navigation reprise vers ${target.label}`, {
          category: 'nav',
          action: 'nav_resumed',
          actors: [_characterId],
          object: objId ? { id: objId, label: target.label, slotId: currentInstruction.slotId } : undefined,
        });
        navigationErrorRef.current = null;
      }
      statusRef.current = 'MOVING';
      if (distance(position, { x: target.tx, z: target.tz }) < 1e-6) {
        if (currentInstruction.smartObjectId) { stateRef.current.x = target.tx; stateRef.current.z = target.tz; }
        if (target.ty !== undefined) stateRef.current.y = target.ty;

        if (currentInstruction.type === 'OBSERVE_OBJECT') {
          statusRef.current = 'INTERACTING';
          timerRef.current = currentInstruction.duration!;
          const idleAnimId = resolveAnimationId('idle');
          stateRef.current.animation = idleAnimId;
          const objId = currentInstruction.smartObjectId;
          appLog(_characterId, `👀 Observation : ${target.label}`, {
            category: 'object',
            action: 'observe',
            actors: [_characterId],
            animation: { id: idleAnimId, mode: 'solo', actorId: _characterId },
            object: objId ? { id: objId, label: target.label, slotId: currentInstruction.slotId } : undefined,
          });
        } else if (currentInstruction.type === 'USE_OBJECT') {
          const objId = currentInstruction.smartObjectId;
          if (objId) routeRef.current.owner = getInteractionOwner(target.owner ?? objId);
          const slotId = currentInstruction.slotId || (objId ? SMART_OBJECTS[objId]?.slots[0]?.slotId : undefined) || 'default';
          if (objId && OccupancyManager.isSlotOccupied(objId, slotId, _characterId)) {
            const occupant = OccupancyManager.getOccupant(objId, slotId);
            const objName = SMART_OBJECTS[objId]?.name || objId;
            appLog(_characterId, `⚠️ ${objName} est déjà occupé${occupant ? ` (${occupant})` : ''} à l'arrivée, passage à la suite`, {
              category: 'object',
              action: 'slot_occupied',
              actors: [_characterId],
              object: { id: objId, label: objName, slotId },
            });
            releaseClaimedSlot();
            statusRef.current = 'IDLE';
            advanceToNextStep(hasNavStep);
            return stateRef.current;
          }

          if (objId && (!claimedSlotRef.current || claimedSlotRef.current.objectId !== objId)) {
            OccupancyManager.claimSlot(objId, slotId, _characterId);
            claimedSlotRef.current = { objectId: objId, slotId };
          }

          statusRef.current = 'INTERACTING';
          if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
            setDesk2SmartActionState(_characterId, true);
          }
          repeatIndexRef.current = 0;
          targetRepeatsRef.current = currentInstruction.repeatCount ?? target.repeatCount ?? 1;
          repeatVariationRef.current = currentInstruction.repeatVariation ?? target.repeatVariation ?? false;

          if (isDuoAction) {
            duoSessionManager.markReady(_characterId);
            duoWaitTimerRef.current = 0;
            const animState = duoSessionManager.getCurrentAnimState(_characterId);
            if (animState && duoRoleRef.current) {
              stateRef.current.animation = duoRoleRef.current === 'roleA' ? animState.clipA : animState.clipB;
            } else {
              stateRef.current.animation = duoRoleRef.current === 'roleA'
                ? 'female-standing-pose'
                : 'female-standing-pose-1';
            }
          }

          if (!currentInstruction.animation && target.anim) currentInstruction.animation = target.anim;
          if (currentInstruction.rotY === undefined && target.rotY !== undefined) currentInstruction.rotY = target.rotY;
          if (!currentInstruction.duration && target.duration) currentInstruction.duration = target.duration;

          if (!isDuoAction) {
            const rawAnim = currentInstruction.animation || target.anim || '';
            const duoDef = currentInstruction.smartObjectId ? getDuoAnimationForClip(rawAnim) : undefined;
            const isDuoCooldown = Date.now() - lastDuoEndTimeRef.current < 15000;

            if (duoDef && !isDuoCooldown && !duoSessionManager.isPlaying(_characterId) && !duoRoleRef.current) {
              const duoRes = duoSessionManager.startDuoSession(
                currentInstruction.smartObjectId!,
                currentInstruction.slotId,
                _characterId,
                undefined,
                duoDef.id
              );
              if ((!duoRes && !canCharacterPerformDuo(_characterId, duoDef)) || (duoRes && duoRes.targetA !== _characterId && duoRes.targetB !== _characterId)) {
                statusRef.current = 'IDLE';
                stateRef.current.animation = 'idle';
                releaseClaimedSlot();
                advanceToNextStep(hasNavStep);
                return stateRef.current;
              }
              if (duoRes) {
                duoRoleRef.current = duoRes.targetB === _characterId ? 'roleB' : 'roleA';
                duoSessionManager.markReady(_characterId);
                duoWaitTimerRef.current = 0;
                claimedSlotRef.current = { objectId: currentInstruction.smartObjectId!, slotId: `${duoRes.actualSlotId}:${duoRoleRef.current}` };
                const isSittingDuo = Boolean(currentInstruction.slotId?.includes('sit') || currentInstruction.smartObjectId?.includes('chair') || currentInstruction.smartObjectId?.includes('sofa'));
                stateRef.current.animation = isSittingDuo ? 'sitting-idle' : 'female-standing-pose';
              }
            }

            if (!duoRoleRef.current) {
              const explicitDuration = currentInstruction.duration || target.duration;
              const estimated = getEstimatedClipDuration(currentInstruction.animation || target.anim);
              timerRef.current = explicitDuration || (estimated <= 1.0 ? 10.0 : estimated);
              stateRef.current.animation = resolveAnimationId(currentInstruction.animation || target.anim || 'idle');
            }
          }

          stateRef.current.y = target.ty ?? 0;
          if (currentInstruction.rotY !== undefined) stateRef.current.rotY = currentInstruction.rotY;

          triggerInstructionEvent(currentInstruction);

          const animation = currentInstruction.animation || target.anim || '';
          const isDuoWaiting = isDuoAction && duoSessionManager.isWaitingPartner(_characterId);
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
              const resolvedUseAnimId = resolveAnimationId(animation || 'idle');
              const useAnimDef = getAnimationDef(resolvedUseAnimId);
              appLog(_characterId, `🎭 Action: ${objPrefix}${label}${triggerInfo} (${timerRef.current.toFixed(1)}s${repeatsInfo})`, {
                category: objId ? 'object' : 'anim',
                action: 'use_object',
                actors: [_characterId],
                animation: { id: useAnimDef?.id ?? resolvedUseAnimId, mode: 'solo', label: useAnimDef?.label ?? label, actorId: _characterId },
                object: objId ? { id: objId, label: objName, slotId } : undefined,
              });
            }
          }
        } else {
          statusRef.current = 'IDLE';
          currentWalkAnimRef.current = getRandomNpcWalkAnimation(_characterId);
          advanceToNextStep(hasNavStep);
        }
      } else {
        stateRef.current.animation = moved > 0 ? currentWalkAnimRef.current : 'idle';
      }
    } else if (statusRef.current === 'INTERACTING') {
      // Observation never resolves a slot animation or joins a duo session.
      if (currentInstruction.type === 'OBSERVE_OBJECT') {
        const target = getResolvedCoords(currentInstruction);
        if (distance(stateRef.current, { x: target.tx, z: target.tz }) >= 1e-6) {
          statusRef.current = 'MOVING';
          return stateRef.current;
        }
        stateRef.current.animation = resolveAnimationId('idle');
        stateRef.current.rotY = computeRotYStep(stateRef.current.rotY, target.rotY!, ROT_SPEED, dt);
        timerRef.current -= dt;
        if (timerRef.current <= 0) {
          statusRef.current = 'IDLE';
          advanceToNextStep(hasNavStep);
        }
        return stateRef.current;
      }
      // ── 5. Interactions (INTERACTING) ──
      const isDuoAction = isDuoSlot(currentInstruction.smartObjectId, currentInstruction.slotId)
        || !!duoRoleRef.current;
      if (isDuoAction) {
        const isEnded = handleDuoInteraction({
          characterId: _characterId,
          dt,
          state: stateRef.current,
          duoRole: duoRoleRef.current,
          duoWaitTimer: duoWaitTimerRef.current,
          duoInvited: duoInvitedRef.current,
          onSessionEnded: () => {
            resetDuoState();
            stepIndexRef.current++;
            lastDuoEndTimeRef.current = Date.now();
          },
          setDuoWaitTimer: (t) => { duoWaitTimerRef.current = t; },
          setDuoInvited: (inv) => { duoInvitedRef.current = inv; }
        });

        if (isEnded) {
          statusRef.current = 'IDLE';
          currentWalkAnimRef.current = getRandomNpcWalkAnimation(_characterId);
          return stateRef.current;
        }
        return stateRef.current;
      }

      if (currentInstruction.type === 'ROTATE_360') {
        const totalDuration = currentInstruction.duration || 5.0;
        const turnSpeed = (2 * Math.PI) / totalDuration;
        stateRef.current.rotY = (stateRef.current.rotY + turnSpeed * dt) % (2 * Math.PI);
        stateRef.current.animation = resolveAnimationId(currentInstruction.animation || 'idle');

        timerRef.current -= dt;
        if (timerRef.current <= 0) {
          statusRef.current = 'IDLE';
          advanceToNextStep(hasNavStep);
        }
        return stateRef.current;
      }

      const target = getResolvedCoords(currentInstruction);
      stateRef.current.animation = resolveAnimationId(currentInstruction.animation || target.anim || 'idle');
      if (currentInstruction.type === 'USE_OBJECT' || currentInstruction.type === 'INTERACT') {
        if (currentInstruction.smartObjectId) { stateRef.current.x = target.tx; stateRef.current.z = target.tz; }
        if (target.ty !== undefined) stateRef.current.y = target.ty;
      }

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

                const duoDef = getDuoAnimationForClip(res.animation);
                const isDuoCooldown = Date.now() - lastDuoEndTimeRef.current < 15000;
                if (duoDef && !isDuoCooldown && !duoSessionManager.isPlaying(_characterId) && !duoRoleRef.current) {
                  const duoRes = duoSessionManager.startDuoSession(
                    currentInstruction.smartObjectId,
                    currentInstruction.slotId,
                    _characterId,
                    undefined,
                    duoDef.id
                  );
                  if ((!duoRes && !canCharacterPerformDuo(_characterId, duoDef)) || (duoRes && duoRes.targetA !== _characterId && duoRes.targetB !== _characterId)) {
                    statusRef.current = 'IDLE';
                    stateRef.current.animation = 'idle';
                    releaseClaimedSlot();
                    advanceToNextStep(hasNavStep);
                    return stateRef.current;
                  }
                  if (duoRes) {
                    duoRoleRef.current = duoRes.targetB === _characterId ? 'roleB' : 'roleA';
                    duoSessionManager.markReady(_characterId);
                    duoWaitTimerRef.current = 0;
                    claimedSlotRef.current = { objectId: currentInstruction.smartObjectId, slotId: `${duoRes.actualSlotId}:${duoRoleRef.current}` };
                    const isSittingDuo = Boolean(currentInstruction.slotId?.includes('sit') || currentInstruction.smartObjectId?.includes('chair') || currentInstruction.smartObjectId?.includes('sofa'));
                    stateRef.current.animation = isSittingDuo ? 'sitting-idle' : 'female-standing-pose';
                    return stateRef.current;
                  }
                }
              }
              if (res.rotY !== undefined) {
                currentInstruction.rotY = res.rotY;
                stateRef.current.rotY = res.rotY;
              }
              cachedCoordsInstructionRef.current = null;
              cachedCoordsRef.current = null;
              const updatedTarget = getResolvedCoords(currentInstruction);
              stateRef.current.x = updatedTarget.tx;
              stateRef.current.y = updatedTarget.ty ?? 0;
              stateRef.current.z = updatedTarget.tz;
            }
          }
          const estimated = getEstimatedClipDuration(currentInstruction.animation || stateRef.current.animation);
          const cycleDuration = currentInstruction.duration
            || target.duration
            || (estimated <= 1.0 ? 10.0 : estimated);
          timerRef.current = cycleDuration;
          return stateRef.current;
        }

        repeatIndexRef.current = 0;
        targetRepeatsRef.current = 1;

        if (beginExitTransition(true)) {
          if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
            setDesk2SmartActionState(_characterId, false);
          }
          return stateRef.current;
        }

        statusRef.current = 'IDLE';
        if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
          setDesk2SmartActionState(_characterId, false);
        }
        advanceToNextStep(hasNavStep);
      }
    }

    deployment.status = statusRef.current;
    deployment.y = stateRef.current.y;
    return stateRef.current;
  };

  const update = (dt: number): AgentState => {
    if (!enabled) return stateRef.current;
    const instruction = dynamicNavIndexRef.current < dynamicNavQueueRef.current.length
      ? dynamicNavQueueRef.current[dynamicNavIndexRef.current] : scenario?.[stepIndexRef.current];
    const blocked = blockedCoordsRef.current;
    if (blocked && blocked.instruction === instruction && blocked.x === stateRef.current.x && blocked.z === stateRef.current.z
      && blocked.owner === routeRef.current.owner && blocked.graph === getNavigationGraph(getAgentProfile(_characterId), undefined, instruction?.closedDoor)
      && actorBlocksUnchanged(blocked.actorBlockers)) return stateRef.current;
    if (blocked && blocked.instruction === instruction) statusRef.current = blocked.status;
    blockedCoordsRef.current = null;
    const status = statusRef.current;
    try { return advance(dt); }
    catch (error) {
      if (!(error instanceof NavigationBlockedError) || !instruction) throw error;
      blockedCoordsRef.current = { instruction, graph: getNavigationGraph(getAgentProfile(_characterId), undefined, instruction.closedDoor), x:stateRef.current.x, z:stateRef.current.z, owner:routeRef.current.owner, status, actorBlockers:error.actorBlockers };
      stateRef.current.animation = BLOCKED_ANIMATION;
      statusRef.current = 'BLOCKED';
      const label = instruction.smartObjectId ? (SMART_OBJECTS[instruction.smartObjectId]?.name ?? instruction.smartObjectId) : instruction.targetZoneId ?? instruction.type;
      reportNavigationStop(error.message, label, error.target, error.actorBlockers);
      if (instruction.smartObjectId) {
        retrySmartAction(instruction.smartObjectId);
        return stateRef.current;
      }
      resetRoute(routeRef.current, _characterId);
      cachedCoordsRef.current = null;
      cachedCoordsInstructionRef.current = null;
      navigationDebug.set(_characterId, { path:[], target:error.target, error:error.message });
      return stateRef.current;
    }
  };

  const setPosition = (x: number, y: number, z: number) => {
    if (transitionRef.current) {
      statusRef.current = 'IDLE';
      stateRef.current.animation = resolveAnimationId('idle');
    }
    stateRef.current.animationPaused = false;
    transitionRef.current = null;
    playbackRef.current = null;
    initialProfileResolvedRef.current = true;
    resetRoute(routeRef.current, _characterId);
    routeRef.current.owner = undefined;
    stateRef.current.x = x;
    stateRef.current.y = y;
    stateRef.current.z = z;
    deployment.y = y;
  };

  const setRotation = (rotY: number) => {
    stateRef.current.rotY = rotY;
  };

  const hasPendingDynamicTask = () => {
    return dynamicNavQueueRef.current.length > 0 && dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
  };

  const getStatus = () => statusRef.current;

  const reportAnimationPlayback = (animation: string, progress: number, finished: boolean) => {
    playbackRef.current = { animation, progress, finished };
  };

  return { update, setPosition, setRotation, hasPendingDynamicTask, getStatus, reportAnimationPlayback, initialPos: startPosRef.current };
}
