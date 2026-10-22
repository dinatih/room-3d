import { AgentInstruction } from './aiTypes';
import { SMART_OBJECTS, getSmartObject, buildSmartObjectInstructionSequence, isDuoSlot } from './smartObjectRegistry';
import { getAvailableAutonomousActivities } from './autonomousActivities';
import { OccupancyManager } from './occupancyManager';
import { duoSessionManager, DuoRole } from './duoSessionManager';
import { canCharacterPerformDuo, getDuoAnimationForClip } from '../animations/duoAnimations';
import { createRouteState, followRoute, resetRoute, getInteractionOwner, getContainingObjectOwner, getObjectApproach, movePostureTransition, NavigationBlockedError, getNavigationGraph, describeNavigationBlock, prepareInteractionNavigation } from './navigation/service';
import { prepareKitchenStorageAccess, releaseKitchenStorageAccess } from './diyChairClearance';
import { hasAgentProfile, getObstacleRevision, furnitureClearance, getAgentProfile, navigationDebug, furnitureObstacles } from './navigation/obstacles';
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
import { DRONA_SE_ITEMS } from '../items/kallaxSeDrona';
import { DRONA_SPECIAL_ITEMS } from '../items/dronaStorage';
import { BATHROOM_STORAGE_ITEMS } from '../items/bathroomStorage';
import { KITCHEN_DRONA_ITEMS } from '../items/kallaxCuisineDrona';
import { releaseAgentDoors } from './navigation/doorRequests';
import { setDesk2SmartActionState } from '@features/scene/utils/deskScreenVideo';
import { NavigationScope, NavigationPending } from './navigation/navigationScope';

export type { AgentState };
export { NPC_WALK_ANIMATIONS, getRandomNpcWalkAnimation };

export const NAVIGATION_WAIT_ANIMATION = resolveAnimationId('sad-idle');

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

export function createAgentController(
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
  const navigationScope = new NavigationScope();
  let landingAnimId = resolveAnimationId(landingAnim);
  const landingDuration = getAnimationDef(landingAnimId)?.duration ?? 1.4;
  // Déduire le fondu croisé (0.2s) pour que l'enchaînement vers l'étape suivante s'opère pile à la fin du clip sans rejeu
  let landingPhaseDuration = Math.max(0.1, landingDuration - 0.2);

  const firstCoords = (scenario && scenario.length > 0 && scenario[0].type !== 'OBSERVE_OBJECT') ? resolveInstructionCoords(scenario[0], null) : null;
  const initialPos = (firstCoords && (firstCoords.tx !== 0 || firstCoords.tz !== 0))
    ? { x: firstCoords.tx, y: firstCoords.ty ?? 0, z: firstCoords.tz, rotY: firstCoords.rotY ?? 0 }
    : getRealPosition();

  let deployment = enabled ? agentDeploymentMap.get(_characterId) : undefined;
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

  let state: AgentState = {
    x: initialPos.x,
    y: deployment.y,
    z: initialPos.z,
    rotY: initialPos.rotY,
    animation: isCurrentlyFalling
      ? (deployment.timer <= 3.0 ? 'falling-idle' : 'falling')
      : (firstCoords?.anim ? resolveAnimationId(firstCoords.anim) : 'idle'),
    isSpawned: !isStillWaiting
  };

  let stepIndex = 0;
  let timer = deployment.timer;
  let agentStatus: AgentStatus = deployment.status;
  let animationPlayback: { animation: string; progress: number; finished: boolean } | null = null;
  let postureTransition: {
    animation: string; sourceAnimation: string; targetAnimation?: string; y: number; advanceStep: boolean;
    departure: { x: number; z: number }; owner?: string;
    destination?: { x: number; z: number };
  } | null = null;
  const beginExitTransition = (advanceStep: boolean) => {
    if (!(useSceneStore.getState().layers.exitTransitions ?? false)) return false;
    const exit = getExitTransition(state.animation);
    if (!exit) return false;
    const owner = route.owner ?? claimedSlot?.objectId;
    postureTransition = {
      animation: exit.anim, sourceAnimation: state.animation, y: state.y, advanceStep,
      departure: { x: state.x, z: state.z },
      destination: cachedCoords?.owner === owner ? cachedCoords?.approach : undefined,
      owner: owner ? getInteractionOwner(owner) : undefined,
    };
    animationPlayback = null;
    agentStatus = 'TRANSITIONING';
    return true;
  };
  let delayTimer = deployment.delayTimer;
  let prevScenario: AgentInstruction[] | null | undefined = undefined;
  let startPos: { x: number; y: number; z: number; rotY: number; owner?: string } = initialPos;
  let claimedSlot: { objectId: string; slotId: string } | null = null;

  // Instructions temporaires (actions demandées, rendez-vous et interactions duo).
  let dynamicNavQueue: AgentInstruction[] = [];
  let dynamicNavIndex = 0;
  let manualOverride = false;
  let interruptedSmartObjectId: string | undefined = undefined;
  let route = createRouteState();
  let routeInstruction: AgentInstruction | null = null;
  let navigationError: string | null = null;
  const reportNavigationStop = (reason: string, label: string, target: { x: number; z: number }, actorBlockers?: ActorBlockers, pending = false) => {
    const key = `${label}:${reason}`;
    if (navigationError === key) return;
    navigationError = key;
    const instruction = dynamicNavQueue[dynamicNavIndex] ?? scenario?.[stepIndex] ?? routeInstruction;
    const objId = instruction?.smartObjectId ?? claimedSlot?.objectId;
    appLog(
      _characterId,
      pending
        ? `⏳ Navigation en attente vers ${label} : ${reason} — position (${state.x.toFixed(1)}, ${state.z.toFixed(1)}), animation ${state.animation}`
        : `🚧 Navigation bloquée vers ${label} : ${reason} — ${describeNavigationBlock(_characterId, state, target, route, actorBlockers)}`,
      {
        category: 'nav',
        action: pending ? 'nav_waiting' : 'nav_blocked',
        actors: [_characterId],
        animation: pending ? { id: state.animation, mode: 'solo', actorId: _characterId } : undefined,
        object: objId ? { id: objId, label, slotId: instruction?.slotId ?? claimedSlot?.slotId } : undefined,
      }
    );
  };
  let initialProfileResolved = false;
  let spawnObstacleRevision = -1;
  let blockedCoords: { instruction: AgentInstruction; graph: ReturnType<typeof getNavigationGraph>; x: number; z: number; owner?: string; status: AgentStatus; actorBlockers: ActorBlockers } | null = null;

  // Animation de marche courante pour les trajets
  let currentWalkAnim: string = getRandomNpcWalkAnimation(_characterId);

  // Ref pour éviter les logs dupliqués à chaque frame
  let lastLog: string = '';

  // Gestion spécifique du rôle et attente pour la duo-zone
  let duoRole: DuoRole | null = null;
  let duoWaitTimer: number = 0;
  let duoInvited: boolean = false;
  let lastDuoEndTime: number = 0;

  // Répétitions d'animation et variations pour SmartObjects
  let repeatIndex: number = 0;
  let targetRepeats: number = 1;
  let repeatVariation: boolean = false;

  // Cache de la résolution de l'instruction en cours pour éviter de réallouer / recalculer resolveInstructionCoords à chaque frame
  let cachedCoords: ReturnType<typeof resolveInstructionCoords> | null = null;
  let cachedCoordsInstruction: AgentInstruction | null = null;
  let cachedCoordsRevision = -1;
  let cachedTargetKey: string | undefined;

  const getResolvedCoords = (instr: AgentInstruction) => {
    const revision = getObstacleRevision();
    const object = instr.smartObjectId && !instr.targetPos ? getSmartObject(instr.smartObjectId) : undefined;
    const slot = object ? object.slots.find(slot => slot.slotId === instr.slotId) ?? object.slots[0] : undefined;
    const targetKey = object ? JSON.stringify([object.position, object.rotationY, slot?.offset, slot?.approachOffset, slot?.rotY]) : undefined;
    const occupiedApproach = (agentStatus !== 'INTERACTING' || instr.type === 'OBSERVE_OBJECT') && cachedCoords && hasAgentProfile(_characterId)
      && !isAgentDestinationFree(_characterId, { x: cachedCoords.tx, z: cachedCoords.tz });
    const coords = cachedCoords;
    const obstructedTarget = coords && cachedCoordsRevision !== revision && hasAgentProfile(_characterId) && [...furnitureObstacles.values()]
      .some(o => (!coords.owner || !o.owner || getInteractionOwner(o.owner) !== getInteractionOwner(coords.owner)) && o.yMin < getAgentProfile(_characterId).height && o.yMax > 0
        && pointInRing({ x: coords.tx, z: coords.tz }, inflate(o.polygon, furnitureClearance(getAgentProfile(_characterId)))));
    if (occupiedApproach || obstructedTarget || cachedTargetKey !== targetKey || cachedCoordsInstruction !== instr || !cachedCoords) {
      beginActorBlockCheck(_characterId);
      try {
        cachedCoords = resolveInstructionCoords(instr, startPos, _characterId, state, route.owner);
        cachedCoordsInstruction = instr;
        cachedTargetKey = targetKey;
      }
      catch (error) {
        if (error instanceof NavigationBlockedError) error.actorBlockers = endActorBlockCheck(_characterId);
        throw error;
      } finally { endActorBlockCheck(_characterId); }
    }
    cachedCoordsRevision = revision;
    return cachedCoords;
  };


  const releaseClaimedSlot = () => {
    releaseKitchenStorageAccess(_characterId);
    resetRoute(route, _characterId);
    if (claimedSlot) {
      if (claimedSlot.objectId === 'desk-bollsidan-2') {
        setDesk2SmartActionState(_characterId, false);
      }
      if (claimedSlot.objectId === 'cuisine-group' && claimedSlot.slotId === 'cook-oven') {
        useSceneStore.getState().triggerAction('ninja', false);
      }
      if (claimedSlot.objectId === 'fridge' || claimedSlot.objectId === 'freezer') {
        useSceneStore.getState().triggerAction(claimedSlot.objectId, false);
      }
      if (claimedSlot.objectId === 'drona-ne-catchall') {
        useSceneStore.getState().triggerAction('drona-ne-catchall-slide', false);
      }
      const drona = DRONA_SE_ITEMS[claimedSlot.objectId] ?? DRONA_SPECIAL_ITEMS[claimedSlot.objectId as keyof typeof DRONA_SPECIAL_ITEMS] ?? BATHROOM_STORAGE_ITEMS[claimedSlot.objectId as keyof typeof BATHROOM_STORAGE_ITEMS] ?? KITCHEN_DRONA_ITEMS[claimedSlot.objectId as keyof typeof KITCHEN_DRONA_ITEMS];
      if (drona && 'action' in drona) {
        useSceneStore.getState().triggerAction(drona.action, false);
      }
      if (claimedSlot.objectId === 'corridor-closet') {
        useSceneStore.getState().triggerAction('corrDoors', false);
      }
      if (claimedSlot.objectId === 'sdb-closet') {
        useSceneStore.getState().triggerAction('sdbClosetR', false);
        useSceneStore.getState().triggerAction('sdbClosetL', false);
      }
      OccupancyManager.releaseSlot(claimedSlot.objectId, claimedSlot.slotId, _characterId);
      claimedSlot = null;
    }
  };

  // Libérer toutes les réservations au démontage et écouter les invitations de duo
  const connect = () => {
    if (!enabled) return () => {};
    const onInvite = (e: any) => {
      if (e.detail?.targetId === _characterId) {
        const store = useSceneStore.getState();
        const isFromUI = e.detail?.fromId === 'HoverMenu' || e.detail?.fromId === 'ZoneAiDebug' || e.detail?.fromId === 'Toolbar' || e.detail?.fromId === 'SidePanel' || e.detail?.fromId === 'Inventory';
        if (_characterId === store.activeCharacterId && !isFromUI) {
          return;
        }

        const targetObjId = e.detail?.objectId;
        if (targetObjId && !OccupancyManager.canUseObject(targetObjId, _characterId)) return;
        navigationScope.clear();
        const role = (e.detail?.forceRole as DuoRole) || 'roleB';
        if (role) {
          duoRole = role;
          duoInvited = true;
          const targetSlotId = e.detail?.slotId || role;
          if (claimedSlot && (claimedSlot.objectId !== targetObjId || claimedSlot.slotId !== targetSlotId)) {
            releaseClaimedSlot();
          }
          if (targetObjId) {
            claimedSlot = { objectId: targetObjId, slotId: targetSlotId };
          }

          // Coordonnées précalculées transmises par startDuoOnSmartObject (posA / posB monde)
          const eventTargetPos = e.detail?.targetPos as [number, number, number] | undefined;
          const eventTargetRotY = e.detail?.targetRotY as number | undefined;

          dynamicNavQueue = [
            { type: 'USE_OBJECT', smartObjectId: targetObjId, slotId: targetSlotId, targetPos: eventTargetPos, rotY: eventTargetRotY }
          ];
          dynamicNavIndex = 0;
          resetRoute(route, _characterId);
          routeInstruction = null;
          cachedCoordsInstruction = null;
          cachedCoords = null;

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
            agentStatus = 'INTERACTING';
            duoSessionManager.markReady(_characterId);
            const animState = duoSessionManager.getCurrentAnimState(_characterId);
            if (animState) {
              state.animation = role === 'roleA' ? animState.clipA : animState.clipB;
            }
          } else {
            agentStatus = 'IDLE';
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

        navigationScope.clear();
        releaseClaimedSlot();
        duoSessionManager.leaveDuoZone(_characterId);
        duoRole = null;
        duoInvited = false;

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
            claimedSlot = { objectId, slotId: targetSlot };
          }
          dynamicNavQueue = seq;
          dynamicNavIndex = 0;
          resetRoute(route, _characterId);
          routeInstruction = null;
          if (deployment.hasCompleted) {
            agentStatus = 'IDLE';
            beginExitTransition(false);
          }
          cachedCoordsInstruction = null;
          cachedCoords = null;
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
      navigationScope.clear();
      document.removeEventListener('npc-retry-smartaction', onRetrySmartAction);
      document.removeEventListener('npc-invite-duo', onInvite);
      document.removeEventListener('agent-force-smartobject', onForceSmartObject);
      releaseClaimedSlot();
      OccupancyManager.releaseAllForCharacter(_characterId);
      duoSessionManager.leaveDuoZone(_characterId);
      setDesk2SmartActionState(_characterId, false);
    };
  };

  const syncScenario = () => {
    if (scenario !== prevScenario) {
      navigationScope.clear();
      releaseKitchenStorageAccess(_characterId);
      const previousAnimation = state.animation;
      const previousTransition = postureTransition;
      const departureOwner = route.owner ?? claimedSlot?.objectId
        ?? (hasAgentProfile(_characterId) ? getContainingObjectOwner(_characterId, getRealPosition()) : undefined);
      if (claimedSlot) {
        releaseClaimedSlot();
        OccupancyManager.releaseAllForCharacter(_characterId);
        duoSessionManager.leaveDuoZone(_characterId);
        setDesk2SmartActionState(_characterId, false);
        claimedSlot = null;
        duoRole = null;
        duoInvited = false;
      }
      // SkyDrop n'est initialisé que si le personnage n'a pas encore démarré son déploiement
      const shouldSkyDrop = hasSkyDrop && !deployment.hasStarted;
      const isWait = shouldSkyDrop && spawnDelay > 0;
      const isFallNow = shouldSkyDrop && spawnDelay === 0;

      stepIndex = 0;
      repeatIndex = 0;
      targetRepeats = 1;

      if (shouldSkyDrop) {
        timer = isFallNow ? 6.0 : 0;
        agentStatus = isWait ? 'WAITING' : (isFallNow ? 'FALLING' : 'IDLE');
        delayTimer = spawnDelay;
        deployment.status = agentStatus;
        deployment.timer = timer;
        deployment.delayTimer = spawnDelay;
        if (isFallNow) {
          deployment.hasStarted = true;
        }
      } else {
        agentStatus = deployment.hasCompleted ? 'IDLE' : deployment.status;
        timer = deployment.hasCompleted ? 0 : deployment.timer;
        delayTimer = deployment.delayTimer;
      }

      const firstScenario = prevScenario === undefined;
      prevScenario = scenario;
      dynamicNavQueue = [];
      dynamicNavIndex = 0;
      resetRoute(route, _characterId);
      route.owner = departureOwner;
      routeInstruction = null;
      cachedCoordsInstruction = null;
      cachedCoords = null;

      if (scenario) {
        const stepCoords = firstScenario && scenario.length > 0 && scenario[0].type !== 'OBSERVE_OBJECT'
          ? resolveInstructionCoords(scenario[0], null) : null;
        const real = (stepCoords && (stepCoords.tx !== 0 || stepCoords.tz !== 0))
          ? { x: stepCoords.tx, y: stepCoords.ty ?? 0, z: stepCoords.tz, rotY: stepCoords.rotY ?? 0 }
          : getRealPosition();

        state.x = real.x;
        state.y = deployment.hasCompleted ? real.y : deployment.y;
        state.z = real.z;
        state.rotY = real.rotY;
        state.isSpawned = deployment.status !== 'WAITING';
        state.animation = deployment.status === 'FALLING'
          ? (deployment.timer <= 3.0 ? 'falling-idle' : 'falling')
          : (deployment.status === 'WAITING' ? 'idle' : (stepCoords?.anim ? resolveAnimationId(stepCoords.anim) : 'idle'));
        startPos = { x: real.x, y: real.y, z: real.z, rotY: real.rotY, owner: departureOwner };
      }
      if (!firstScenario && deployment.hasCompleted) {
        state.animation = previousAnimation;
        if (previousTransition) {
          previousTransition.advanceStep = false;
          agentStatus = 'TRANSITIONING';
        } else {
          beginExitTransition(false);
        }
      }
    }

  };
  const ROT_SPEED = 5;

  const triggerInstructionEvent = (instruction: AgentInstruction) => {
    if (instruction.waitForAnimation) animationPlayback = null;
    if (!instruction.triggerEventKey) return;
    useSceneStore.getState().triggerAction(instruction.triggerEventKey, instruction.triggerEventValue);
  };

  const advanceToNextStep = (hasNavStep: boolean) => {
    const next = hasNavStep ? dynamicNavQueue[dynamicNavIndex + 1] ?? scenario?.[stepIndex] : scenario?.[stepIndex + 1];
    resetRoute(route, _characterId, next?.protectedDoor);
    routeInstruction = null;
    cachedCoordsInstruction = null;
    cachedCoords = null;
    if (hasNavStep) {
      dynamicNavIndex++;
      if (dynamicNavIndex >= dynamicNavQueue.length) {
        dynamicNavQueue = [];
        dynamicNavIndex = 0;
        const nextInstr = scenario && stepIndex < scenario.length ? scenario[stepIndex] : null;
        if (claimedSlot && (!nextInstr || nextInstr.smartObjectId !== claimedSlot.objectId || (nextInstr.slotId && nextInstr.slotId !== claimedSlot.slotId))) {
          releaseClaimedSlot();
        }
      } else {
        const nextDynamicInstr = dynamicNavQueue[dynamicNavIndex];
        if (claimedSlot && nextDynamicInstr?.smartObjectId && (nextDynamicInstr.smartObjectId !== claimedSlot.objectId || (nextDynamicInstr.slotId && nextDynamicInstr.slotId !== claimedSlot.slotId))) {
          releaseClaimedSlot();
        }
      }
    } else {
      stepIndex++;
      const nextInstr = scenario && stepIndex < scenario.length ? scenario[stepIndex] : null;
      if (claimedSlot && (!nextInstr || nextInstr.smartObjectId !== claimedSlot.objectId || (nextInstr.slotId && nextInstr.slotId !== claimedSlot.slotId))) {
        releaseClaimedSlot();
      }
    }
  };

  const resetDuoState = () => {
    duoSessionManager.leaveDuoZone(_characterId);
    releaseClaimedSlot();
    duoRole = null;
    duoInvited = false;
    dynamicNavQueue = [];
    dynamicNavIndex = 0;
    cachedCoordsInstruction = null;
    cachedCoords = null;
    agentStatus = 'IDLE';
  };

  const retrySmartAction = (objectId: string) => {
    const departureOwner = route.owner;
    const session = duoSessionManager.getSessionFor(_characterId);
    const partners = [session?.participantA?.characterId, session?.participantB?.characterId]
      .filter((id): id is string => !!id && id !== _characterId);
    // Leaving as the leader closes the whole session, even before either arrival.
    duoSessionManager.leaveDuoZone(session?.participantA?.characterId ?? _characterId);
    resetDuoState();
    OccupancyManager.releaseAllForCharacter(_characterId);
    route.owner = departureOwner;
    routeInstruction = null;
    blockedCoords = null;
    navigationError = null;
    timer = 0;
    duoWaitTimer = 0;
    repeatIndex = 0;
    targetRepeats = 1;
    state.animation = 'idle';
    // Skip the remaining steps of the failed action, including its exit steps.
    while (scenario?.[stepIndex]?.smartObjectId === objectId) stepIndex++;
    const candidates = getAvailableAutonomousActivities(_characterId).filter(activity => activity.id !== objectId);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    dynamicNavQueue = chosen ? buildSmartObjectInstructionSequence(chosen.id, chosen.slotId, _characterId) : [];
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

  const pickNewAutonomousActivity = (excludedObjectId?: string) => {
    const candidates = getAvailableAutonomousActivities(_characterId);

    const nonCurrent = excludedObjectId ? candidates.filter(c => c.id !== excludedObjectId) : candidates;
    const pool = nonCurrent.length > 0 ? nonCurrent : candidates;

    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      dynamicNavQueue = buildSmartObjectInstructionSequence(chosen.id, chosen.slotId, _characterId);
      dynamicNavIndex = 0;
      appLog(_characterId, `🎲 Sortie de contrôle manuel : tirage d'une nouvelle activité (${chosen.id})`, {
        category: 'object',
        action: 'resume_autonomous_new_activity',
        actors: [_characterId],
        object: { id: chosen.id, label: SMART_OBJECTS[chosen.id]?.name },
      });
      // Synchroniser stepIndex pour continuer logiquement dans le scénario après cette activité
      if (scenario && scenario.length > 0) {
        const chosenIdx = scenario.findIndex(s => s.smartObjectId === chosen.id);
        if (chosenIdx !== -1) {
          let nextIdx = chosenIdx;
          while (nextIdx < scenario.length && scenario[nextIdx].smartObjectId === chosen.id) nextIdx++;
          stepIndex = nextIdx;
        } else if (excludedObjectId) {
          while (stepIndex < scenario.length && scenario[stepIndex].smartObjectId === excludedObjectId) {
            stepIndex++;
          }
        }
      }
      return true;
    }

    // Fallback pour les scénarios non basés sur les smart objects (ex: xbot avec tour de conciergerie)
    if (scenario && scenario.length > 0) {
      const moveSteps = scenario
        .map((s, idx) => ({ s, idx }))
        .filter(({ s }) => s.type === 'MOVE_TO' && (!excludedObjectId || s.smartObjectId !== excludedObjectId));
      if (moveSteps.length > 0) {
        const chosenStep = moveSteps[Math.floor(Math.random() * moveSteps.length)];
        stepIndex = chosenStep.idx;
      } else {
        stepIndex = 0;
      }
      dynamicNavQueue = [];
      dynamicNavIndex = 0;
      return true;
    }

    return false;
  };

  // Process instruction changes on the next frame. Recursive retries can loop
  // forever within one frame when every object in a looping scenario is busy.
  const advance = (dt: number): AgentState => {
    const landingThisFrame = agentStatus === 'FALLING' && timer <= dt && cameraState.isSceneLaunched;
    const changedLanding = !deployment.hasCompleted && (spawnObstacleRevision !== getObstacleRevision() || landingThisFrame);
    if ((!initialProfileResolved || changedLanding) && enabled && hasAgentProfile(_characterId)) {
      cachedCoords = null;
      if (scenario?.length && scenario[0].type !== 'OBSERVE_OBJECT') {
        const first = resolveInstructionCoords(scenario[0], null, _characterId);
        if (first.tx !== 0 || first.tz !== 0) {
          state.x = first.tx;
          state.z = first.tz;
          if (_characterId === 'native' && hasSkyDrop && !deployment.hasCompleted && scenario[0].smartObjectId === 'desk-bollsidan-2') {
            const desk = getSmartObject('desk-bollsidan-2')!;
            const away = Math.atan2(first.tx - desk.position[0], first.tz - desk.position[2]);
            // Un pas de 60 cm pour dégager les genoux à l'atterrissage.
            state.x += Math.sin(away) * 60;
            state.z += Math.cos(away) * 60;
          }
          if (agentStatus !== 'WAITING' && agentStatus !== 'FALLING') {
            state.y = first.ty ?? 0;
            deployment.y = state.y;
          }
          startPos = { ...state, y: first.ty ?? 0 };
          const owner = first.owner ?? scenario[0].smartObjectId;
          route.owner = owner ? getInteractionOwner(owner) : undefined;
        }
      }
      initialProfileResolved = true;
      spawnObstacleRevision = getObstacleRevision();
    }
    const hasNavStepInUpdate = dynamicNavIndex < dynamicNavQueue.length;
    if (!scenario && !hasNavStepInUpdate && !postureTransition) {
      state.animation = 'idle';
      return state;
    }

    // ── 1. Gestion SkyDrop (Spawn / Chute / Atterrissage) ──
    if (agentStatus === 'WAITING' || agentStatus === 'FALLING') {
      if (!cameraState.isSceneLaunched) {
        state.animation = agentStatus === 'FALLING' ? 'falling' : 'idle';
        return state;
      }
    }

    if (agentStatus === 'WAITING') {
      delayTimer -= dt;
      deployment.delayTimer = delayTimer;
      if (delayTimer <= 0) {
        agentStatus = 'FALLING';
        timer = 6.0;
        state.isSpawned = true;
        deployment.status = 'FALLING';
        deployment.timer = 6.0;
        deployment.hasStarted = true;
      }
      state.animation = 'idle';
      return state;
    }

    if (agentStatus === 'FALLING') {
      if (!deployment.hasLoggedFalling) {
        deployment.hasLoggedFalling = true;
        appLog(_characterId, `🪂 Déploiement : Tombée du ciel en parachute`, {
          category: 'nav',
          action: 'deploy_fall',
          actors: [_characterId],
          animation: { id: 'falling', mode: 'solo', actorId: _characterId },
        });
      }
      timer -= dt;
      deployment.timer = timer;
      if (timer <= 0) {
        state.y = startPos?.y ?? 0;
        agentStatus = 'LANDING';
        timer = landingPhaseDuration;
        deployment.status = 'LANDING';
        deployment.timer = landingPhaseDuration;
        deployment.y = state.y;
        state.animation = landingAnimId;
        return state;
      } else {
        const p_inv = timer / 6.0;
        const targetY = startPos?.y ?? 0;
        state.y = targetY + (2500 - targetY) * (p_inv * p_inv * p_inv);
        deployment.y = state.y;
        state.animation = timer <= 3.0 ? 'falling-idle' : 'falling';
        return state;
      }
    }

    if (agentStatus === 'LANDING') {
      timer -= dt;
      deployment.timer = timer;
      if (timer <= 0) {
        agentStatus = 'IDLE';
        deployment.status = 'IDLE';
        deployment.hasCompleted = true;
        appLog(_characterId, `🎯 Déploiement terminé (Atterrissage réussi)`, {
          category: 'nav',
          action: 'deploy_landed',
          actors: [_characterId],
          animation: { id: landingAnimId, mode: 'solo', actorId: _characterId },
        });
      } else {
        state.animation = landingAnimId;
        return state;
      }
    }

    // A replacement order must finish the rise without consuming its first step.
    if (postureTransition && agentStatus !== 'TRANSITIONING') {
      postureTransition.advanceStep = false;
      agentStatus = 'TRANSITIONING';
      state.animation = postureTransition.animation;
    }
    // ── 1.5 Gestion des transitions in-between (ex: sit-to-stand, crouch-to-stand, stand-up) ──
    if (agentStatus === 'TRANSITIONING') {
      const transition = postureTransition;
      if (!transition) throw new Error('Missing active posture transition');
      if (transition.owner && !transition.destination && hasAgentProfile(_characterId)) {
        const profile = getAgentProfile(_characterId);
        const direction = { x: Math.sin(state.rotY), z: Math.cos(state.rotY) };
        const owned = [...furnitureObstacles.values()].filter(obstacle => obstacle.owner === transition.owner
          && obstacle.yMin < profile.height && obstacle.yMax > 0);
        if (owned.some(obstacle => pointInRing(transition.departure, inflate(obstacle.polygon, furnitureClearance(profile))))) {
          // Aim past the front boundary with the actor's actual body clearance.
          const reach = Math.max(...owned.flatMap(obstacle => obstacle.polygon.map(point =>
            (point.x - transition.departure.x) * direction.x + (point.z - transition.departure.z) * direction.z))) + profile.radius;
          const goal = { x: transition.departure.x + direction.x * reach, z: transition.departure.z + direction.z * reach };
          const exit = getObjectApproach(transition.owner, goal, _characterId, state, true);
          if (!exit) {
            state.animation = transition.sourceAnimation;
            state.animationPaused = true;
            reportNavigationStop(`Aucune sortie praticable de ${transition.owner}`, transition.owner, goal);
            return state;
          }
          transition.destination = exit;
          route.owner = transition.owner;
        }
      }
      const playback = animationPlayback;
      state.animation = transition.animation;
      state.animationPaused = false;
      if (playback?.animation === transition.animation) {
        if (transition.destination) {
          const target = {
            x: transition.departure.x + (transition.destination.x - transition.departure.x) * playback.progress,
            z: transition.departure.z + (transition.destination.z - transition.departure.z) * playback.progress,
          };
          const previous = { x: state.x, z: state.z };
          const next = movePostureTransition(route, _characterId, previous, target, transition.owner!);
          state.x = next.x;
          state.z = next.z;
          state.animationPaused = distance(next, target) > BOOLEAN_PRECISION;
          if (state.animationPaused && (route.error || route.waitReason)) {
            reportNavigationStop(route.error ?? route.waitReason!, transition.owner ?? 'sortie de posture', transition.destination);
          }
        }
        state.y = transition.y * (1 - playback.progress);
      }
      if (playback?.animation === transition.animation && playback.finished && !state.animationPaused) {
        postureTransition = null;
        agentStatus = 'IDLE';
        state.animation = transition.targetAnimation ?? resolveAnimationId('idle');
        if (transition.advanceStep) {
          advanceToNextStep(hasNavStepInUpdate);
          // Bed routines also describe an explicit edge/floor departure. The
          // animation-driven exit has already completed those steps.
          if (transition.destination) {
            let dynamic = dynamicNavIndex < dynamicNavQueue.length;
            let next = dynamic ? dynamicNavQueue[dynamicNavIndex] : scenario?.[stepIndex];
            while (next?.postureExit) {
              advanceToNextStep(dynamic);
              dynamic = dynamicNavIndex < dynamicNavQueue.length;
              next = dynamic ? dynamicNavQueue[dynamicNavIndex] : scenario?.[stepIndex];
            }
          }
        }
      }
      return state;
    }

    const scenarioLength = scenario ? scenario.length : 0;

    // ── 2. Fin de scénario / Bouclage ──
    if (stepIndex >= scenarioLength && dynamicNavQueue.length === 0) {
      releaseClaimedSlot();
      if (loop && scenarioLength > 0) {
        stepIndex = 0;
        resetRoute(route, _characterId);
        routeInstruction = null;
        cachedCoordsInstruction = null;
        cachedCoords = null;
        const loopKey = `loop-${_characterId}`;
        if (lastLog !== loopKey) {
          lastLog = loopKey;
          appLog(_characterId, '🔄 Nouveau cycle d\'activité autonome', {
            category: 'nav',
            action: 'cycle_restart',
            actors: [_characterId],
          });
        }
      } else {
        if (agentStatus !== 'FINISHED') {
          agentStatus = 'FINISHED';
          if (onComplete) onComplete();
        }
        state.animation = 'idle';
        return state;
      }
    }

    const hasNavStep = dynamicNavIndex < dynamicNavQueue.length;
    const currentInstruction = hasNavStep
      ? dynamicNavQueue[dynamicNavIndex]
      : (scenario ? scenario[stepIndex] : null);

    if (!currentInstruction) {
      state.animation = 'idle';
      return state;
    }

    // ── 3. État IDLE : Initialisation et réservation de l'instruction ──
    if (agentStatus === 'IDLE') {
      if (currentInstruction.smartObjectId && currentInstruction.type !== 'OBSERVE_OBJECT') {
        if (!OccupancyManager.canUseObject(currentInstruction.smartObjectId, _characterId)) {
          throw new Error(`Access denied to ${currentInstruction.smartObjectId} for ${_characterId}`);
        }
        const objId = currentInstruction.smartObjectId;
        let reqSlotId = currentInstruction.slotId || SMART_OBJECTS[objId]?.slots[0]?.slotId || 'default';
        const isDuo = isDuoSlot(objId, reqSlotId);
        if (isDuo) {
          let role = duoRole;
          if (!role) {
            const duoRes = duoSessionManager.startDuoSession(objId, reqSlotId, _characterId);
            if ((!duoRes && _characterId === 'xbot') || (duoRes && duoRes.targetA !== _characterId && duoRes.targetB !== _characterId)) {
              agentStatus = 'IDLE';
              state.animation = 'idle';
              releaseClaimedSlot();
              advanceToNextStep(hasNavStep);
              return state;
            }
            if (duoRes) {
              if (duoRes.targetB === _characterId) {
                role = 'roleB';
                duoRole = 'roleB';
                currentInstruction.targetPos = duoRes.posB;
                currentInstruction.slotId = `${duoRes.actualSlotId}:roleB`;
                currentInstruction.rotY = duoRes.rotB;
                claimedSlot = { objectId: objId, slotId: `${duoRes.actualSlotId}:roleB` };
              } else if (duoRes.targetA === _characterId) {
                role = 'roleA';
                duoRole = 'roleA';
                currentInstruction.targetPos = duoRes.posA;
                currentInstruction.slotId = `${duoRes.actualSlotId}:roleA`;
                currentInstruction.rotY = duoRes.rotA;
                claimedSlot = { objectId: objId, slotId: `${duoRes.actualSlotId}:${duoRole}` };
              }
              // Invalider le cache de coords pour forcer le recalcul avec targetPos
              cachedCoordsInstruction = null;
              cachedCoords = null;
            }
            if (role) duoRole = role;
          }
          if (role) {
            duoRole = role;
            if (!claimedSlot) {
              // Fallback si le claimedSlot n'a pas été défini ci-dessus (ex: roleA via onInvite)
              currentInstruction.slotId = reqSlotId || role;
              claimedSlot = { objectId: objId, slotId: currentInstruction.slotId };
            }
          } else if (loop && scenario) {
            while (stepIndex < scenario.length && scenario[stepIndex].smartObjectId === objId) {
              stepIndex++;
            }
            dynamicNavQueue = [];
            dynamicNavIndex = 0;
            cachedCoordsInstruction = null;
            cachedCoords = null;
            return state;
          }
        } else if (claimedSlot?.objectId !== objId || (currentInstruction.slotId && claimedSlot?.slotId !== reqSlotId)) {
          if (claimedSlot && (claimedSlot.objectId !== objId || claimedSlot.slotId !== reqSlotId)) {
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
              claimedSlot = { objectId: objId, slotId: altSlotId };
              cachedCoordsInstruction = null;
              cachedCoords = null;
              if (currentInstruction.type === 'MOVE_TO') {
                // A different action can require a different approach and bed
                // climb. Replace the whole routine, including its exit steps.
                const queue = hasNavStep ? dynamicNavQueue : scenario;
                if (!queue) throw new Error(`Missing instruction queue for ${objId}`);
                const index = hasNavStep ? dynamicNavIndex : stepIndex;
                let end = index;
                while (end < queue.length && queue[end].smartObjectId === objId) end++;
                queue.splice(index, end - index, ...buildSmartObjectInstructionSequence(objId, altSlotId, _characterId));
                resetRoute(route, _characterId);
                return state;
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
                while (dynamicNavIndex < dynamicNavQueue.length &&
                       dynamicNavQueue[dynamicNavIndex].smartObjectId === objId) {
                  dynamicNavIndex++;
                }
                if (dynamicNavIndex >= dynamicNavQueue.length) {
                  dynamicNavQueue = [];
                  dynamicNavIndex = 0;
                }
                resetRoute(route, _characterId);
                cachedCoordsInstruction = null;
                cachedCoords = null;
                return state;
              } else if (scenario) {
                appLog(_characterId, `⚠️ ${objName} est occupé${occupant ? ` (${occupant})` : ''}, recherche d'une autre place...`, {
                  category: 'object',
                  action: 'slot_occupied',
                  actors: [_characterId],
                  object: { id: objId, label: objName, slotId: reqSlotId },
                });
                while (stepIndex < scenario.length && scenario[stepIndex].smartObjectId === objId) {
                  stepIndex++;
                }
                dynamicNavQueue = [];
                dynamicNavIndex = 0;
                resetRoute(route, _characterId);
                cachedCoordsInstruction = null;
                cachedCoords = null;
                return state;
              } else {
                appLog(_characterId, `⚠️ ${objName} est actuellement occupé${occupant ? ` (${occupant})` : ''}`, {
                  category: 'object',
                  action: 'slot_occupied',
                  actors: [_characterId],
                  object: { id: objId, label: objName, slotId: reqSlotId },
                });
                agentStatus = 'FINISHED';
                if (onComplete) onComplete();
                state.animation = 'idle';
                return state;
              }
            }
          } else {
            OccupancyManager.claimSlot(objId, reqSlotId, _characterId);
            claimedSlot = { objectId: objId, slotId: reqSlotId };
            const chosenSlot = SMART_OBJECTS[objId]?.slots.find(s => s.slotId === reqSlotId);
            if (chosenSlot && !currentInstruction.animation) {
              const resolved = resolveSlotAnimation(chosenSlot);
              currentInstruction.animation = resolved.animation;
              if (chosenSlot.duration && !currentInstruction.duration) currentInstruction.duration = chosenSlot.duration;
              if (currentInstruction.rotY === undefined) currentInstruction.rotY = resolved.rotY;
            }
          }
        } else if (!currentInstruction.animation) {
          const targetSlotId = reqSlotId || claimedSlot?.slotId;
          const chosenSlot = SMART_OBJECTS[objId]?.slots.find(s => s.slotId === targetSlotId);
          if (chosenSlot) {
            const resolved = resolveSlotAnimation(chosenSlot);
            currentInstruction.animation = resolved.animation;
            if (chosenSlot.duration && !currentInstruction.duration) currentInstruction.duration = chosenSlot.duration;
            if (currentInstruction.rotY === undefined) currentInstruction.rotY = resolved.rotY;
          }
        }
      }

      if (currentInstruction.type === 'PREPARE_OBJECT') {
        const objectId = currentInstruction.smartObjectId;
        if (objectId !== 'drona-kitchen-diy' && objectId !== 'drona-kitchen-electronics') throw new Error(`Unknown object preparation ${objectId}`);
        state.animation = 'idle';
        const logKey = `prepare-${stepIndex}-${dynamicNavIndex}`;
        if (lastLog !== logKey) {
          lastLog = logKey;
          appLog(_characterId, '🪑 Arrivé devant le rangement : dégagement du mobilier avant utilisation', {
            category: 'object', action: 'object_prepare', actors: [_characterId], object: { id: objectId, slotId: currentInstruction.slotId },
          });
        }
        if (!prepareKitchenStorageAccess(_characterId)) return state;
        advanceToNextStep(hasNavStep);
        return state;
      }
      if (currentInstruction.type === 'MOVE_TO' || currentInstruction.type === 'RETURN_TO_START' || currentInstruction.type === 'USE_OBJECT' || currentInstruction.type === 'OBSERVE_OBJECT') {
        const target = getResolvedCoords(currentInstruction);
        const next = hasNavStep ? dynamicNavQueue[dynamicNavIndex + 1] : scenario?.[stepIndex + 1];
        if (currentInstruction.type === 'MOVE_TO' && next?.smartObjectId && next.smartObjectId === currentInstruction.smartObjectId
          && (next.navigation === 'interaction' || next.type === 'USE_OBJECT') && hasAgentProfile(_characterId)) {
          const object = getSmartObject(next.smartObjectId), slot = object?.slots.find(slot => slot.slotId === next.slotId);
          if (object && slot?.offset) prepareInteractionNavigation(_characterId, slot.navigationOwner ?? object.id, { x: slot.offset[0], z: slot.offset[2] });
        }

        agentStatus = 'MOVING';
        state.animation = currentWalkAnim;
        const logKey = `move-${stepIndex}-${dynamicNavIndex}-${target.label}`;
        if (lastLog !== logKey) {
          lastLog = logKey;
          const walkAnimId = resolveAnimationId(currentWalkAnim || 'walk');
          const walkAnimDef = getAnimationDef(walkAnimId);
          const animName = walkAnimDef?.label || (currentWalkAnim || 'walk')
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
        const target = getResolvedCoords(currentInstruction);
        if (currentInstruction.triggerEventKey) {
          triggerInstructionEvent(currentInstruction);
        }

        agentStatus = 'INTERACTING';
        if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
          setDesk2SmartActionState(_characterId, true);
        }
        if (!currentInstruction.animation && target.anim) currentInstruction.animation = target.anim;
        if (currentInstruction.rotY === undefined && target.rotY !== undefined) currentInstruction.rotY = target.rotY;
        if (!currentInstruction.duration && target.duration) currentInstruction.duration = target.duration;
        timer = currentInstruction.duration || target.duration || 1.0;
        if (currentInstruction.waitForAnimation && currentInstruction.rotY !== undefined) state.rotY = currentInstruction.rotY;
        const resolvedAnimId = resolveAnimationId(currentInstruction.animation || target.anim || 'idle');
        state.animation = resolvedAnimId;

        const animation = currentInstruction.animation || target.anim || '';
        const objId = currentInstruction.smartObjectId;
        const objName = objId ? (SMART_OBJECTS[objId]?.name || objId) : '';
        const logKey = `interact-${stepIndex}-${dynamicNavIndex}-${animation}-${objName}`;
        if (lastLog !== logKey) {
          lastLog = logKey;
          const slotInfo = currentInstruction.slotId ? ` (slot ${currentInstruction.slotId})` : '';
          const triggerInfo = currentInstruction.triggerEventKey ? ` ⚡ ${currentInstruction.triggerEventKey}` : '';
          const animDef = getAnimationDef(resolvedAnimId);
          const label = animDef?.label || (animation
            ? animation.replace('animations/', '').replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ')
            : currentInstruction.type);
          const objPrefix = objName ? `[${objName}${slotInfo}] ` : '';
          appLog(_characterId, `🎭 Action: ${objPrefix}${label}${triggerInfo} (${timer.toFixed(1)}s)`, {
            category: objId ? 'object' : 'anim',
            action: 'interact',
            actors: [_characterId],
            animation: { id: animDef?.id ?? resolvedAnimId, mode: 'solo', label, actorId: _characterId },
            object: objId ? { id: objId, label: objName, slotId: currentInstruction.slotId } : undefined,
          });
        }
      } else if (currentInstruction.type === 'ROTATE_360') {
        agentStatus = 'INTERACTING';
        const duration = currentInstruction.duration || 5.0;
        timer = duration;
        const resolvedAnimId = resolveAnimationId(currentInstruction.animation || 'idle');
        state.animation = resolvedAnimId;
        const logKey = `rotate360-${stepIndex}-${dynamicNavIndex}`;
        if (lastLog !== logKey) {
          lastLog = logKey;
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
    if (agentStatus === 'MOVING' || agentStatus === 'BLOCKED') {
      const target = getResolvedCoords(currentInstruction);
      const entering = currentInstruction.type === 'USE_OBJECT' && target.entryAnimation && target.approach
        && distance(state, { x: target.tx, z: target.tz }) > BOOLEAN_PRECISION;
      const goal = entering ? target.approach! : { x: target.tx, z: target.tz };

      if (!hasAgentProfile(_characterId)) return state;
      if (routeInstruction !== currentInstruction) {
        resetRoute(route, _characterId, currentInstruction.protectedDoor);
        routeInstruction = currentInstruction;
        if (target.approach) {
          route.approach = target.approach;
          route.interactionTarget = { x: target.tx, z: target.tz };
        }
      }
      const isDuoAction = isDuoSlot(currentInstruction.smartObjectId, currentInstruction.slotId) || !!duoRole;
      const speed = getWalkSpeedForAnimation(currentWalkAnim);
      const oldPosition = { x: state.x, z: state.z };
      const position = followRoute(route, _characterId, oldPosition, goal, speed * dt,
        (direction, remaining) => {
          const steering = computeSteeringVector(_characterId, oldPosition.x, oldPosition.z, direction.x, direction.z, remaining);
          return { x: steering.steerX, z: steering.steerZ };
        }, target.owner ?? currentInstruction.smartObjectId, currentInstruction.type === 'USE_OBJECT' || currentInstruction.navigation === 'interaction'
          || (currentInstruction.type === 'RETURN_TO_START' && Boolean(target.owner)), currentInstruction.protectedDoor);
      state.x = position.x;
      state.z = position.z;
      const moved = distance(oldPosition, position);
      if (currentInstruction.navigation === 'interaction' && target.ty !== undefined && moved > 0) {
        const remaining = distance(oldPosition, { x: target.tx, z: target.tz });
        state.y += (target.ty - state.y) * Math.min(1, moved / remaining);
      }
      if (moved > 0) state.rotY = computeRotYStep(state.rotY, Math.atan2(position.x - oldPosition.x, position.z - oldPosition.z), ROT_SPEED, dt);
      if (route.error) {
        state.animation = NAVIGATION_WAIT_ANIMATION;
        agentStatus = 'BLOCKED';
        reportNavigationStop(route.error, target.label, { x: target.tx, z: target.tz });
        if (currentInstruction.smartObjectId) retrySmartAction(currentInstruction.smartObjectId);
        return state;
      }
      if (moved === 0 && dt > 0 && distance(position, { x: target.tx, z: target.tz }) >= 1e-6) {
        reportNavigationStop(route.waitReason ?? 'Aucun déplacement produit par le suivi du trajet (cause non identifiée)', target.label, { x: target.tx, z: target.tz });
      } else if (moved > 0 && navigationError) {
        const objId = currentInstruction.smartObjectId;
        appLog(_characterId, `✅ Navigation reprise vers ${target.label}`, {
          category: 'nav',
          action: 'nav_resumed',
          actors: [_characterId],
          object: objId ? { id: objId, label: target.label, slotId: currentInstruction.slotId } : undefined,
        });
        navigationError = null;
      }
      agentStatus = 'MOVING';
      if (distance(position, goal) < 1e-6) {
        if (entering) {
          postureTransition = {
            animation: resolveAnimationId(target.entryAnimation!), sourceAnimation: state.animation,
            targetAnimation: resolveAnimationId(currentInstruction.animation ?? target.anim ?? 'idle'),
            y: state.y, advanceStep: false, departure: { ...position },
            destination: { x: target.tx, z: target.tz }, owner: target.owner ?? currentInstruction.smartObjectId,
          };
          animationPlayback = null;
          state.rotY = currentInstruction.rotY ?? target.rotY ?? state.rotY;
          state.animation = postureTransition.animation;
          agentStatus = 'TRANSITIONING';
          return state;
        }
        if (currentInstruction.smartObjectId) { state.x = target.tx; state.z = target.tz; }
        if (target.ty !== undefined) state.y = target.ty;

        if (currentInstruction.type === 'OBSERVE_OBJECT') {
          agentStatus = 'INTERACTING';
          timer = currentInstruction.duration!;
          const idleAnimId = resolveAnimationId('idle');
          state.animation = idleAnimId;
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
          if (objId) route.owner = getInteractionOwner(target.owner ?? objId);
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
            agentStatus = 'IDLE';
            advanceToNextStep(hasNavStep);
            return state;
          }

          if (objId && (!claimedSlot || claimedSlot.objectId !== objId)) {
            OccupancyManager.claimSlot(objId, slotId, _characterId);
            claimedSlot = { objectId: objId, slotId };
          }

          if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
            setDesk2SmartActionState(_characterId, true);
          }
          repeatIndex = 0;
          targetRepeats = currentInstruction.repeatCount ?? target.repeatCount ?? 1;
          repeatVariation = currentInstruction.repeatVariation ?? target.repeatVariation ?? false;

          if (isDuoAction) {
            duoSessionManager.markReady(_characterId);
            duoWaitTimer = 0;
            const animState = duoSessionManager.getCurrentAnimState(_characterId);
            if (animState && duoRole) {
              state.animation = duoRole === 'roleA' ? animState.clipA : animState.clipB;
            } else {
              state.animation = duoRole === 'roleA'
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
            const isDuoCooldown = Date.now() - lastDuoEndTime < 15000;

            if (duoDef && !isDuoCooldown && !duoSessionManager.isPlaying(_characterId) && !duoRole) {
              const duoRes = duoSessionManager.startDuoSession(
                currentInstruction.smartObjectId!,
                currentInstruction.slotId,
                _characterId,
                undefined,
                duoDef.id
              );
              if ((!duoRes && !canCharacterPerformDuo(_characterId, duoDef)) || (duoRes && duoRes.targetA !== _characterId && duoRes.targetB !== _characterId)) {
                agentStatus = 'IDLE';
                state.animation = 'idle';
                releaseClaimedSlot();
                advanceToNextStep(hasNavStep);
                return state;
              }
              if (duoRes) {
                duoRole = duoRes.targetB === _characterId ? 'roleB' : 'roleA';
                duoSessionManager.markReady(_characterId);
                duoWaitTimer = 0;
                claimedSlot = { objectId: currentInstruction.smartObjectId!, slotId: `${duoRes.actualSlotId}:${duoRole}` };
                const isSittingDuo = Boolean(currentInstruction.slotId?.includes('sit') || currentInstruction.smartObjectId?.includes('chair') || currentInstruction.smartObjectId?.includes('sofa'));
                state.animation = isSittingDuo ? 'sitting-idle' : 'female-standing-pose';
              }
            }

            if (!duoRole) {
              const explicitDuration = currentInstruction.duration || target.duration;
              const estimated = getEstimatedClipDuration(currentInstruction.animation || target.anim);
              timer = explicitDuration || (estimated <= 1.0 ? 10.0 : estimated);
              state.animation = resolveAnimationId(currentInstruction.animation || target.anim || 'idle');
            }
          }

          agentStatus = 'INTERACTING';
          state.y = target.ty ?? 0;
          if (currentInstruction.rotY !== undefined) state.rotY = currentInstruction.rotY;

          triggerInstructionEvent(currentInstruction);

          const animation = currentInstruction.animation || target.anim || '';
          const isDuoWaiting = isDuoAction && duoSessionManager.isWaitingPartner(_characterId);
          if (!isDuoWaiting) {
            const objName = currentInstruction.smartObjectId ? (SMART_OBJECTS[currentInstruction.smartObjectId]?.name || currentInstruction.smartObjectId) : '';
            const logKey = `interact-${stepIndex}-${animation}-${objName}`;
            if (lastLog !== logKey) {
              lastLog = logKey;
              const slotInfo = currentInstruction.slotId ? ` (slot ${currentInstruction.slotId})` : '';
              const triggerInfo = currentInstruction.triggerEventKey ? ` ⚡ ${currentInstruction.triggerEventKey}` : '';
              const label = animation
                ? animation.replace('animations/', '').replace('.glb', '').replace(/^(anim_|miley_armature_)/, '').replace(/_/g, ' ')
                : 'USE_OBJECT';
              const objPrefix = objName ? `[${objName}${slotInfo}] ` : '';
              const repeatsInfo = targetRepeats > 1 ? ` x${targetRepeats}` : '';
              const resolvedUseAnimId = resolveAnimationId(animation || 'idle');
              const useAnimDef = getAnimationDef(resolvedUseAnimId);
              appLog(_characterId, `🎭 Action: ${objPrefix}${label}${triggerInfo} (${timer.toFixed(1)}s${repeatsInfo})`, {
                category: objId ? 'object' : 'anim',
                action: 'use_object',
                actors: [_characterId],
                animation: { id: useAnimDef?.id ?? resolvedUseAnimId, mode: 'solo', label: useAnimDef?.label ?? label, actorId: _characterId },
                object: objId ? { id: objId, label: objName, slotId } : undefined,
              });
            }
          }
        } else {
          agentStatus = 'IDLE';
          currentWalkAnim = getRandomNpcWalkAnimation(_characterId);
          advanceToNextStep(hasNavStep);
        }
      } else {
        state.animation = moved > 0 ? currentWalkAnim : NAVIGATION_WAIT_ANIMATION;
      }
    } else if (agentStatus === 'INTERACTING') {
      // Observation never resolves a slot animation or joins a duo session.
      if (currentInstruction.type === 'OBSERVE_OBJECT') {
        const target = getResolvedCoords(currentInstruction);
        if (distance(state, { x: target.tx, z: target.tz }) >= 1e-6) {
          agentStatus = 'MOVING';
          return state;
        }
        state.animation = resolveAnimationId('idle');
        state.rotY = computeRotYStep(state.rotY, target.rotY!, ROT_SPEED, dt);
        timer -= dt;
        if (timer <= 0) {
          agentStatus = 'IDLE';
          advanceToNextStep(hasNavStep);
        }
        return state;
      }
      // ── 5. Interactions (INTERACTING) ──
      const isDuoAction = isDuoSlot(currentInstruction.smartObjectId, currentInstruction.slotId)
        || !!duoRole;
      if (isDuoAction) {
        const isEnded = handleDuoInteraction({
          characterId: _characterId,
          dt,
          state: state,
          duoRole: duoRole,
          duoWaitTimer: duoWaitTimer,
          duoInvited: duoInvited,
          onSessionEnded: () => {
            resetDuoState();
            stepIndex++;
            lastDuoEndTime = Date.now();
          },
          setDuoWaitTimer: (t) => { duoWaitTimer = t; },
          setDuoInvited: (inv) => { duoInvited = inv; }
        });

        if (isEnded) {
          agentStatus = 'IDLE';
          currentWalkAnim = getRandomNpcWalkAnimation(_characterId);
          return state;
        }
        return state;
      }

      if (currentInstruction.type === 'ROTATE_360') {
        const totalDuration = currentInstruction.duration || 5.0;
        const turnSpeed = (2 * Math.PI) / totalDuration;
        state.rotY = (state.rotY + turnSpeed * dt) % (2 * Math.PI);
        state.animation = resolveAnimationId(currentInstruction.animation || 'idle');

        timer -= dt;
        if (timer <= 0) {
          agentStatus = 'IDLE';
          advanceToNextStep(hasNavStep);
        }
        return state;
      }

      const target = getResolvedCoords(currentInstruction);
      state.animation = resolveAnimationId(currentInstruction.animation || target.anim || 'idle');
      if (currentInstruction.type === 'USE_OBJECT' || currentInstruction.type === 'INTERACT') {
        if (currentInstruction.smartObjectId) { state.x = target.tx; state.z = target.tz; }
        if (target.ty !== undefined) state.y = target.ty;
      }

      const targetRotY = currentInstruction.rotY !== undefined ? currentInstruction.rotY : target.rotY;
      if (targetRotY !== undefined) {
        state.rotY = computeRotYStep(state.rotY, targetRotY, ROT_SPEED, dt);
      }

      if (currentInstruction.waitForAnimation) {
        const playback = animationPlayback;
        if (playback?.animation !== state.animation || !playback.finished) return state;
        timer = 0;
      }
      timer -= dt;
      if (timer <= 0) {
        if (repeatIndex + 1 < targetRepeats) {
          repeatIndex++;
          if (repeatVariation && currentInstruction.smartObjectId && currentInstruction.slotId) {
            const obj = SMART_OBJECTS[currentInstruction.smartObjectId];
            const slot = obj?.slots?.find(s => s.slotId === currentInstruction.slotId);
            if (slot) {
              const res = resolveSlotAnimation(slot);
              if (res.animation) {
                currentInstruction.animation = res.animation;
                state.animation = res.animation;

                const duoDef = getDuoAnimationForClip(res.animation);
                const isDuoCooldown = Date.now() - lastDuoEndTime < 15000;
                if (duoDef && !isDuoCooldown && !duoSessionManager.isPlaying(_characterId) && !duoRole) {
                  const duoRes = duoSessionManager.startDuoSession(
                    currentInstruction.smartObjectId,
                    currentInstruction.slotId,
                    _characterId,
                    undefined,
                    duoDef.id
                  );
                  if ((!duoRes && !canCharacterPerformDuo(_characterId, duoDef)) || (duoRes && duoRes.targetA !== _characterId && duoRes.targetB !== _characterId)) {
                    agentStatus = 'IDLE';
                    state.animation = 'idle';
                    releaseClaimedSlot();
                    advanceToNextStep(hasNavStep);
                    return state;
                  }
                  if (duoRes) {
                    duoRole = duoRes.targetB === _characterId ? 'roleB' : 'roleA';
                    duoSessionManager.markReady(_characterId);
                    duoWaitTimer = 0;
                    claimedSlot = { objectId: currentInstruction.smartObjectId, slotId: `${duoRes.actualSlotId}:${duoRole}` };
                    const isSittingDuo = Boolean(currentInstruction.slotId?.includes('sit') || currentInstruction.smartObjectId?.includes('chair') || currentInstruction.smartObjectId?.includes('sofa'));
                    state.animation = isSittingDuo ? 'sitting-idle' : 'female-standing-pose';
                    return state;
                  }
                }
              }
              if (res.rotY !== undefined) {
                currentInstruction.rotY = res.rotY;
                state.rotY = res.rotY;
              }
              cachedCoordsInstruction = null;
              cachedCoords = null;
              const updatedTarget = getResolvedCoords(currentInstruction);
              state.x = updatedTarget.tx;
              state.y = updatedTarget.ty ?? 0;
              state.z = updatedTarget.tz;
            }
          }
          const estimated = getEstimatedClipDuration(currentInstruction.animation || state.animation);
          const cycleDuration = currentInstruction.duration
            || target.duration
            || (estimated <= 1.0 ? 10.0 : estimated);
          timer = cycleDuration;
          return state;
        }

        repeatIndex = 0;
        targetRepeats = 1;

        if (beginExitTransition(true)) {
          if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
            setDesk2SmartActionState(_characterId, false);
          }
          return state;
        }

        agentStatus = 'IDLE';
        if (currentInstruction.smartObjectId === 'desk-bollsidan-2') {
          setDesk2SmartActionState(_characterId, false);
        }
        advanceToNextStep(hasNavStep);
      }
    }

    deployment.status = agentStatus;
    deployment.y = state.y;
    return state;
  };

  const updateCurrent = (dt: number): AgentState => {
    if (!enabled) return state;
    if (manualOverride) {
      manualOverride = false;
      if (loop) {
        pickNewAutonomousActivity(interruptedSmartObjectId);
      }
      interruptedSmartObjectId = undefined;
    }
    const instruction = dynamicNavIndex < dynamicNavQueue.length
      ? dynamicNavQueue[dynamicNavIndex] : scenario?.[stepIndex];
    const blocked = blockedCoords;
    if (blocked && blocked.instruction === instruction && blocked.x === state.x && blocked.z === state.z
      && blocked.owner === route.owner && blocked.graph === getNavigationGraph(getAgentProfile(_characterId), undefined)
      && actorBlocksUnchanged(blocked.actorBlockers)) return state;
    if (blocked && blocked.instruction === instruction) agentStatus = blocked.status;
    blockedCoords = null;
    const status = agentStatus;
    try { return advance(dt); }
    catch (error) {
      if (!(error instanceof NavigationBlockedError) || !instruction) throw error;
      releaseAgentDoors(_characterId);
      blockedCoords = { instruction, graph: getNavigationGraph(getAgentProfile(_characterId), undefined), x:state.x, z:state.z, owner:route.owner, status, actorBlockers:error.actorBlockers };
      state.animation = NAVIGATION_WAIT_ANIMATION;
      agentStatus = 'BLOCKED';
      const label = instruction.smartObjectId ? (SMART_OBJECTS[instruction.smartObjectId]?.name ?? instruction.smartObjectId) : instruction.targetZoneId ?? instruction.type;
      reportNavigationStop(error.message, label, error.target, error.actorBlockers);
      if (instruction.smartObjectId) {
        retrySmartAction(instruction.smartObjectId);
        return state;
      }
      resetRoute(route, _characterId);
      cachedCoords = null;
      cachedCoordsInstruction = null;
      navigationDebug.set(_characterId, { path:[], target:error.target, error:error.message });
      return state;
    }
  };

  const setPosition = (x: number, y: number, z: number) => {
    navigationScope.clear();
    if (!manualOverride) {
      manualOverride = true;
      const activeInstruction = dynamicNavIndex < dynamicNavQueue.length
        ? dynamicNavQueue[dynamicNavIndex]
        : (scenario ? scenario[stepIndex] : null);
      const currentObjId = activeInstruction?.smartObjectId ?? claimedSlot?.objectId;
      interruptedSmartObjectId = currentObjId;

      const session = duoSessionManager.getSessionFor(_characterId);
      const partners = [session?.participantA?.characterId, session?.participantB?.characterId]
        .filter((id): id is string => !!id && id !== _characterId);
      duoSessionManager.leaveDuoZone(session?.participantA?.characterId ?? _characterId);
      resetDuoState();

      releaseClaimedSlot();
      OccupancyManager.releaseAllForCharacter(_characterId);

      resetRoute(route, _characterId);
      route.owner = undefined;
      routeInstruction = null;
      cachedCoordsInstruction = null;
      cachedCoords = null;
      blockedCoords = null;
      navigationError = null;
      postureTransition = null;
      animationPlayback = null;
      timer = 0;
      duoWaitTimer = 0;
      repeatIndex = 0;
      targetRepeats = 1;
      dynamicNavQueue = [];
      dynamicNavIndex = 0;
      agentStatus = 'IDLE';
      state.animation = resolveAnimationId('idle');
      state.animationPaused = false;

      if (currentObjId) {
        for (const targetId of partners) {
          document.dispatchEvent(new CustomEvent('npc-retry-smartaction', { detail: { targetId, objectId: currentObjId } }));
        }
      }
    }
    state.animationPaused = false;
    postureTransition = null;
    animationPlayback = null;
    initialProfileResolved = true;
    resetRoute(route, _characterId);
    route.owner = undefined;
    state.x = x;
    state.y = y;
    state.z = z;
    deployment.y = y;
    if (deployment.status === 'FALLING' || deployment.status === 'WAITING') {
      deployment.hasCompleted = true;
      deployment.hasStarted = true;
      agentStatus = 'IDLE';
    }
  };

  const setRotation = (rotY: number) => {
    state.rotY = rotY;
  };

  const update = (dt: number): AgentState => {
    const { x, z } = state;
    const instruction = dynamicNavQueue[dynamicNavIndex] ?? scenario?.[stepIndex];
    let waitingForNavigation = false;
    let pendingReason: string | undefined;
    try { return navigationScope.run(() => updateCurrent(dt)); }
    catch (error) {
      if (!(error instanceof NavigationPending)) throw error;
      waitingForNavigation = true;
      pendingReason = error.job.description;
      if (agentStatus === 'TRANSITIONING') state.animationPaused = true;
      return state;
    } finally {
      const next = dynamicNavQueue[dynamicNavIndex] ?? scenario?.[stepIndex];
      const continuingInteraction = instruction?.waitForAnimation && instruction.smartObjectId && next?.smartObjectId === instruction.smartObjectId && next.slotId === instruction.slotId;
      if ((agentStatus === 'MOVING' || (agentStatus === 'IDLE' && !continuingInteraction)) && state.x === x && state.z === z) state.animation = agentStatus === 'MOVING' || waitingForNavigation ? NAVIGATION_WAIT_ANIMATION : 'idle';
      if (pendingReason) {
        const instruction = dynamicNavQueue[dynamicNavIndex] ?? scenario?.[stepIndex];
        const objId = instruction?.smartObjectId;
        const label = objId ? SMART_OBJECTS[objId]?.name ?? objId : instruction?.targetZoneId ?? instruction?.type ?? 'navigation';
        reportNavigationStop(pendingReason, label, state, undefined, true);
      }
    }
  };

  const hasPendingDynamicTask = () => {
    return dynamicNavQueue.length > 0 && dynamicNavIndex < dynamicNavQueue.length;
  };

  const getStatus = () => agentStatus;

  const reportAnimationPlayback = (animation: string, progress: number, finished: boolean) => {
    animationPlayback ??= { animation, progress, finished };
    animationPlayback.animation = animation; animationPlayback.progress = progress; animationPlayback.finished = finished;
  };

  return {
    update, setPosition, setRotation, hasPendingDynamicTask, getStatus, reportAnimationPlayback, connect,
    get state() { return state; },
    get initialPos() { return startPos; },
    configure(next: { scenario: AgentInstruction[] | null; loop: boolean; onComplete?: () => void; landingAnim: string }) {
      scenario = next.scenario; loop = next.loop; onComplete = next.onComplete;
      landingAnimId = resolveAnimationId(next.landingAnim);
      landingPhaseDuration = Math.max(0.1, (getAnimationDef(landingAnimId)?.duration ?? 1.4) - 0.2);
      if (enabled) syncScenario();
    },
  };
}
