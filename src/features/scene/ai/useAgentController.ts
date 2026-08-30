import { useRef, useEffect } from 'react';
import { AgentInstruction } from './aiTypes';
import { WAYPOINTS } from './ZoneNodes';
import { SMART_OBJECTS } from './smartObjectRegistry';
import { resolveSlotAnimation } from './animationPacks';
import { OccupancyManager } from './occupancyManager';
import { duoSessionManager, DuoRole } from './duoSessionManager';
import { buildNavigationWaypoints, getRoomFromCoords } from './navigationGraph';
import { useSceneStore, resolveStoreKey } from '../store/useSceneStore';
import { cameraState } from '../cameraState';
import { getActiveFurnitureObstacles } from './furnitureObstacles';
import { appLog } from '@features/ui/AppConsole';

export interface AgentState {
  x: number;
  y: number;
  z: number;
  rotY: number;
  animation: string;
  isSpawned: boolean;
}

export const NPC_WALK_ANIMATIONS = [
  'animations/locomotion/miley_armature_elegant_walk_2l.glb',
  'animations/locomotion/miley_armature_catwalk_loop.glb',
  'animations/locomotion/miley_armature_walk_f.glb',
  'animations/locomotion/anim_female_walk.glb',
  'animations/locomotion/anim_happy_walk_not_in_place.glb',
  'animations/locomotion/anim_unarmed_walk_forward.glb',
  'animations/locomotion/anim_walking.glb',
  'animations/locomotion/anim_walking_slow.glb',
  'animations/locomotion/anim_wheelbarrow_walk_2.glb'
];

export function getRandomNpcWalkAnimation(characterId?: string): string {
  if (characterId === 'xbot') {
    return 'animations/locomotion/anim_walking.glb';
  }
  return NPC_WALK_ANIMATIONS[Math.floor(Math.random() * NPC_WALK_ANIMATIONS.length)];
}

function resolveInstructionCoords(instr: AgentInstruction, startPos: { x: number; z: number } | null): { tx: number; ty?: number; tz: number; label: string; rotY?: number; anim?: string; duration?: number } {
  if (instr.type === 'RETURN_TO_START' && startPos) {
    return { tx: startPos.x, tz: startPos.z, label: 'point de départ' };
  }
  const waypointId = instr.targetWaypointId || instr.targetNodeId;
  if (waypointId && WAYPOINTS[waypointId]) {
    const node = WAYPOINTS[waypointId];
    return { tx: node.x, tz: node.z, label: node.name || node.id, rotY: instr.rotY ?? node.rotationY };
  }
  if (instr.smartObjectId && SMART_OBJECTS[instr.smartObjectId]) {
    const obj = SMART_OBJECTS[instr.smartObjectId];
    const slot = instr.slotId
      ? (obj.slots.find(s => s.slotId === instr.slotId) ?? obj.slots[0])
      : obj.slots[0];
    const pos = slot ? (slot.approachOffset ?? slot.offset) : obj.position;
    const resolved = slot ? resolveSlotAnimation(slot) : null;
    return {
      tx: pos[0],
      ty: pos[1],
      tz: pos[2],
      label: `${obj.name}${slot ? ` (${slot.name})` : ''}`,
      rotY: resolved?.rotY ?? slot?.rotY,
      anim: resolved?.animation ?? slot?.animation,
      duration: slot?.duration
    };
  }
  if (instr.targetPos) {
    return { tx: instr.targetPos[0], tz: instr.targetPos[2], label: `pos(${instr.targetPos[0].toFixed(0)}, ${instr.targetPos[2].toFixed(0)})` };
  }
  return { tx: 0, tz: 0, label: 'inconnu' };
}


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
  const statusRef = useRef<'WAITING' | 'FALLING' | 'LANDING' | 'IDLE' | 'MOVING' | 'INTERACTING' | 'FINISHED'>(
    isWaiting ? 'WAITING' : (isFallingImmediately ? 'FALLING' : 'IDLE')
  );
  const delayTimerRef = useRef(spawnDelay);
  const prevScenarioRef = useRef<AgentInstruction[] | null | undefined>(undefined);
  const startPosRef = useRef<{x: number, y: number, z: number, rotY: number} | null>(initialPos);
  const claimedSlotRef = useRef<{ objectId: string; slotId: string } | null>(null);
  
  // Navigation dynamique inter-pièces
  const dynamicNavQueueRef = useRef<AgentInstruction[]>([]);
  const dynamicNavIndexRef = useRef(0);
  const activeNavStepIndexRef = useRef<number>(-1);

  // Animation de marche courante pour les trajets (fixe anim_walking pour Xbot, variée pour autres PNJ)
  const currentWalkAnimRef = useRef<string>(getRandomNpcWalkAnimation(_characterId));

  // Ref pour éviter les logs dupliqués à chaque frame
  const lastLogRef = useRef<string>('');

  // Gestion spécifique du rôle et attente pour la duo-zone
  const duoRoleRef = useRef<DuoRole | null>(null);
  const duoWaitTimerRef = useRef<number>(0);
  const duoInvitedRef = useRef<boolean>(false);

  // Libérer toutes les réservations au démontage et écouter les invitations de duo
  useEffect(() => {
    const onInvite = (e: any) => {
      if (e.detail?.targetId === _characterId) {
        // Si le personnage est déjà en train de faire la duo-zone ou dans la duo-zone, ignorer
        if (claimedSlotRef.current?.objectId === 'duo-zone' || duoRoleRef.current) return;
        const role = (e.detail?.forceRole as DuoRole) || duoSessionManager.joinDuoZone(_characterId);
        if (role) {
          duoRoleRef.current = role;
          if (claimedSlotRef.current) {
            OccupancyManager.releaseSlot(claimedSlotRef.current.objectId, claimedSlotRef.current.slotId, _characterId);
            claimedSlotRef.current = null;
          }
          claimedSlotRef.current = { objectId: 'duo-zone', slotId: role };
          dynamicNavQueueRef.current = [
            { type: 'USE_OBJECT', smartObjectId: 'duo-zone', slotId: role }
          ];
          dynamicNavIndexRef.current = 0;
          statusRef.current = 'IDLE';
          appLog(_characterId, `🏃‍♂️ Répond à l'appel de ${e.detail.fromId} (${role === 'roleA' ? 'Meneur' : 'Partenaire'}) et rejoint la ✨ Scène Duo !`);
        }
      }
    };

    document.addEventListener('npc-invite-duo', onInvite);
    return () => {
      document.removeEventListener('npc-invite-duo', onInvite);
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
    timerRef.current = isFallNow ? 6.0 : 0;
    statusRef.current = isWait ? 'WAITING' : (isFallNow ? 'FALLING' : 'IDLE');
    delayTimerRef.current = spawnDelay;
    prevScenarioRef.current = scenario;
    dynamicNavQueueRef.current = [];
    dynamicNavIndexRef.current = 0;
    activeNavStepIndexRef.current = -1;
    
    // Sync starting position directly with the first action zone or real position
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

  // Vitesse de déplacement (cm par seconde)
  const SPEED = 100;
  // Vitesse de rotation (radians par seconde)
  const ROT_SPEED = 5;

  const update = (dt: number) => {
    if (!scenario) {
      stateRef.current.animation = 'idle';
      return stateRef.current;
    }

    if (statusRef.current === 'WAITING') {
      delayTimerRef.current -= dt;
      if (delayTimerRef.current <= 0) {
        statusRef.current = 'FALLING';
        timerRef.current = 6.0; // 6 seconds to fall
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
        timerRef.current = 1.96; // duration of crouch_to_stand approx 2s
      } else {
        const p_inv = timerRef.current / 6.0; // 1 to 0
        const targetY = startPosRef.current?.y ?? 0;
        stateRef.current.y = targetY + (2500 - targetY) * (p_inv * p_inv * p_inv); // ease-out (ralenti à la fin)
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

    if (stepIndexRef.current >= scenario.length && dynamicNavQueueRef.current.length === 0) {
      if (claimedSlotRef.current) {
        OccupancyManager.releaseSlot(claimedSlotRef.current.objectId, claimedSlotRef.current.slotId, _characterId);
        claimedSlotRef.current = null;
      }
      if (loop) {
        stepIndexRef.current = 0; // Boucler le scénario
        activeNavStepIndexRef.current = -1;
        // Log de rebouclage, une seule fois par cycle
        const loopKey = `loop-${_characterId}`;
        if (lastLogRef.current !== loopKey) {
          lastLogRef.current = loopKey;
          appLog(_characterId, '🔄 Nouveau cycle d\'activité autonome');
        }
      } else {
        if (statusRef.current !== 'FINISHED') {
          statusRef.current = 'FINISHED' as any;
          if (onComplete) onComplete();
        }
        stateRef.current.animation = 'idle';
        return stateRef.current;
      }
    }

    // ── Détermination de l'instruction active (nav queue prioritaire ou scénario principal) ──
    const hasNavStep = dynamicNavIndexRef.current < dynamicNavQueueRef.current.length;
    const currentInstruction = hasNavStep
      ? dynamicNavQueueRef.current[dynamicNavIndexRef.current]
      : scenario[stepIndexRef.current];

    if (statusRef.current === 'IDLE') {
      // Vérification et réservation d'occupation pour les objets intelligents
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
          } else {
            // Duo-zone complète (2 PNJs déjà dessus), passer au smart object suivant
            if (loop) {
              while (
                stepIndexRef.current < scenario.length &&
                scenario[stepIndexRef.current].smartObjectId === objId
              ) {
                stepIndexRef.current++;
              }
              dynamicNavQueueRef.current = [];
              dynamicNavIndexRef.current = 0;
              return update(dt);
            }
          }
        } else if (OccupancyManager.isSlotOccupied(objId, reqSlotId, _characterId)) {
          // Place occupée : trouver un autre slot libre sur le même meuble si disponible (ex. autre siège d'un lit ou canapé)
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
            // Aucun slot libre sur ce meuble (ex. chaise de bureau ou WC déjà pris par un autre perso)
            const occupant = OccupancyManager.getOccupant(objId, reqSlotId);
            const objName = SMART_OBJECTS[objId]?.name || objId;
            
            if (loop) {
              appLog(_characterId, `⚠️ ${objName} est occupé${occupant ? ` (${occupant})` : ''}, recherche d'une autre place...`);
              // Passer toutes les étapes liées à ce meuble dans le scénario
              while (
                stepIndexRef.current < scenario.length &&
                scenario[stepIndexRef.current].smartObjectId === objId
              ) {
                stepIndexRef.current++;
              }
              dynamicNavQueueRef.current = [];
              dynamicNavIndexRef.current = 0;
              return update(dt);
            } else {
              appLog(_characterId, `⚠️ ${objName} est actuellement occupé${occupant ? ` (${occupant})` : ''}`);
              statusRef.current = 'FINISHED' as any;
              if (onComplete) onComplete();
              stateRef.current.animation = 'idle';
              return stateRef.current;
            }
          }
        } else {
          // Slot libre : réserver la place
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
        const target = resolveInstructionCoords(currentInstruction, startPosRef.current);
        
        // Calculer le chemin inter-pièces UNIQUEMENT une seule fois par instruction principale
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
              // Reprendre avec la 1ère étape de transition
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
          appLog(_characterId, `🚶‍♂️ Marche vers ${target.label} (${target.tx.toFixed(0)}, ${target.tz.toFixed(0)})`);
        }
      } else if (currentInstruction.type === 'INTERACT' || currentInstruction.type === 'WAIT') {
        if (currentInstruction.triggerEventKey) {
          let key = currentInstruction.triggerEventKey;
          
          if (key === 'eastGlassDoor' && useSceneStore.getState().furniture.bimDoubleDoor) {
            key = 'bimDoorRightOpen';
          }

          const store = useSceneStore.getState();
          const resolved = resolveStoreKey(key);
          const furniture = store.furniture as any;
          const extraStates = store.extraStates as any;

          const currentVal = resolved.type === 'furniture'
            ? Boolean(furniture[resolved.name])
            : resolved.type === 'extra'
            ? Boolean(extraStates[resolved.name])
            : false;

          // Si l'état souhaité est déjà actif (ex: porte déjà complètement ouverte), sauter l'étape et l'animation
          if (currentInstruction.triggerTargetState !== undefined) {
            const targetState = currentInstruction.triggerTargetState;
            if (currentVal === targetState) {
              if (hasNavStep) {
                dynamicNavIndexRef.current++;
                if (dynamicNavIndexRef.current >= dynamicNavQueueRef.current.length) {
                  dynamicNavQueueRef.current = [];
                  dynamicNavIndexRef.current = 0;
                }
              } else {
                stepIndexRef.current++;
              }
              return update(dt);
            } else {
              store.triggerAction(key);
            }
          } else {
            store.triggerAction(key);
          }
        }

        statusRef.current = 'INTERACTING';
        const target = resolveInstructionCoords(currentInstruction, startPosRef.current);
        if (!currentInstruction.animation && target.anim) {
          currentInstruction.animation = target.anim;
        }
        if (currentInstruction.rotY === undefined && target.rotY !== undefined) {
          currentInstruction.rotY = target.rotY;
        }
        if (!currentInstruction.duration && target.duration) {
          currentInstruction.duration = target.duration;
        }
        timerRef.current = currentInstruction.duration || target.duration || 1.0;

        // Log action INTERACT
        const animation = currentInstruction.animation || target.anim || '';
        const duration = timerRef.current;
        const logKey = `interact-${stepIndexRef.current}-${dynamicNavIndexRef.current}-${animation}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          const label = animation
            ? animation.replace('animations/', '').replace('.glb', '')
            : currentInstruction.type;
          appLog(_characterId, `🎭 Action: ${label} (${duration.toFixed(1)}s)`);
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


    if (statusRef.current === 'MOVING') {
      const target = resolveInstructionCoords(currentInstruction, startPosRef.current);
      const tx = target.tx;
      const tz = target.tz;

      const dx = tx - stateRef.current.x;
      const dz = tz - stateRef.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Seuil d'arrivée souple : 30 cm pour duo-zone, 8 cm pour smart objects, 18 cm pour les waypoints
      const isDuoZone = currentInstruction.smartObjectId === 'duo-zone';
      const ARRIVAL_THRESHOLD = isDuoZone ? 30.0 : ((currentInstruction.type === 'USE_OBJECT' || (!hasNavStep && currentInstruction.smartObjectId)) ? 8.0 : 18.0);

      if (dist < ARRIVAL_THRESHOLD) {
        // Arrivé au waypoint
        stateRef.current.x = tx;
        stateRef.current.z = tz;
        const arrivedKey = `arrived-${stepIndexRef.current}`;
        if (lastLogRef.current !== arrivedKey) {
          lastLogRef.current = arrivedKey;
        }

        // Si l'instruction est USE_OBJECT, on enchaîne directement sur l'interaction !
        if (currentInstruction.type === 'USE_OBJECT') {
          statusRef.current = 'INTERACTING';
          if (currentInstruction.smartObjectId === 'duo-zone') {
            duoSessionManager.markReady(_characterId);
            duoWaitTimerRef.current = 0;
            const animState = duoSessionManager.getCurrentAnimState();
            timerRef.current = animState?.duration ?? 5.0;
            stateRef.current.animation = duoRoleRef.current === 'roleA'
              ? 'animations/poses_idles/anim_female_standing_pose.glb'
              : 'animations/poses_idles/anim_female_standing_pose_1.glb';
          }
          if (!currentInstruction.animation && target.anim) {
            currentInstruction.animation = target.anim;
          }
          if (currentInstruction.rotY === undefined && target.rotY !== undefined) {
            currentInstruction.rotY = target.rotY;
          }
          if (!currentInstruction.duration && target.duration) {
            currentInstruction.duration = target.duration;
          }
          if (currentInstruction.smartObjectId !== 'duo-zone') {
            timerRef.current = currentInstruction.duration || target.duration || 1.0;
          }
          stateRef.current.y = target.ty ?? 0;
          if (currentInstruction.rotY !== undefined) {
            stateRef.current.rotY = currentInstruction.rotY;
          }
          if (currentInstruction.triggerEventKey) {
            let key = currentInstruction.triggerEventKey;
            if (key === 'eastGlassDoor' && useSceneStore.getState().furniture.bimDoubleDoor) {
              key = 'bimDoorRightOpen';
            }
            const store = useSceneStore.getState();
            const resolved = resolveStoreKey(key);
            const furniture = store.furniture as any;
            const extraStates = store.extraStates as any;
            const currentVal = resolved.type === 'furniture'
              ? Boolean(furniture[resolved.name])
              : resolved.type === 'extra'
              ? Boolean(extraStates[resolved.name])
              : false;

            if (currentInstruction.triggerTargetState !== undefined) {
              if (currentInstruction.triggerTargetState !== currentVal) {
                store.triggerAction(key);
              }
            } else {
              store.triggerAction(key);
            }
          }
          const animation = currentInstruction.animation || target.anim || '';
          const duration = timerRef.current;
          const isDuoWaiting = currentInstruction.smartObjectId === 'duo-zone' && duoSessionManager.isWaitingPartner(_characterId);
          if (!isDuoWaiting) {
            const logKey = `interact-${stepIndexRef.current}-${animation}`;
            if (lastLogRef.current !== logKey) {
              lastLogRef.current = logKey;
              const label = animation
                ? animation.replace('animations/', '').replace('.glb', '')
                : 'USE_OBJECT';
              appLog(_characterId, `🎭 Action: ${label} (${duration.toFixed(1)}s)`);
            }
          }
        } else {
          statusRef.current = 'IDLE';
          currentWalkAnimRef.current = getRandomNpcWalkAnimation(_characterId);
          if (hasNavStep) {
            dynamicNavIndexRef.current++;
            if (dynamicNavIndexRef.current >= dynamicNavQueueRef.current.length) {
              dynamicNavQueueRef.current = [];
              dynamicNavIndexRef.current = 0;
            }
          } else {
            stepIndexRef.current++;
            // Libérer le slot si l'étape suivante ne concerne plus le même objet
            const nextInstr = stepIndexRef.current < scenario.length ? scenario[stepIndexRef.current] : null;
            if (claimedSlotRef.current && (!nextInstr || nextInstr.smartObjectId !== claimedSlotRef.current.objectId)) {
              OccupancyManager.releaseSlot(claimedSlotRef.current.objectId, claimedSlotRef.current.slotId, _characterId);
              claimedSlotRef.current = null;
            }
          }
          stateRef.current.animation = 'idle';
        }
      } else {
        // Déplacement
        stateRef.current.y = 0;
        stateRef.current.animation = currentWalkAnimRef.current;
        
        let dirX = dx / dist;
        let dirZ = dz / dist;

        const currentX = stateRef.current.x;
        const currentZ = stateRef.current.z;
        let avoidanceForceX = 0;
        let avoidanceForceZ = 0;

        // Si nous sommes très proches du waypoint de destination (< 30 cm), réduire l'évitement pour garantir l'arrivée
        const targetProximityDampener = Math.min(1.0, dist / 30.0);

        // ── 1. Évitement et contournement des autres personnages (NPCs et joueur) ──
        const isNpcCollisionsEnabled = useSceneStore.getState().layers.npcCollisions;
        if (isNpcCollisionsEnabled) {
          // Rayon de sécurité personnelle : 35 cm. Distance d'anticipation : jusqu'à 70 cm.
          const AVOID_RADIUS = 35;
          const LOOKAHEAD_DIST = 70;

          // Parcourir les positions des autres personnages connus
          for (const [otherId, pos] of Object.entries(cameraState.positions)) {
            if (otherId === _characterId || !pos) continue;

            const toOtherX = pos.x - currentX;
            const toOtherZ = pos.z - currentZ;
            const otherDist = Math.hypot(toOtherX, toOtherZ);

            if (otherDist > 0.1 && otherDist < LOOKAHEAD_DIST) {
              const forwardProj = toOtherX * dirX + toOtherZ * dirZ;

              if (forwardProj > 0 || otherDist < AVOID_RADIUS) {
                const perpDist = Math.abs(-dirZ * toOtherX + dirX * toOtherZ);

                if (perpDist < AVOID_RADIUS) {
                  const cross = dirX * toOtherZ - dirZ * toOtherX;
                  const steerSide = cross >= 0 ? -1 : 1;

                  const lateralWeight = Math.max(0.2, (AVOID_RADIUS - perpDist) / AVOID_RADIUS);
                  const proximityWeight = Math.max(0.3, (LOOKAHEAD_DIST - otherDist) / LOOKAHEAD_DIST);
                  const steerIntensity = 1.0 * lateralWeight * proximityWeight * targetProximityDampener;

                  const perpX = -dirZ * steerSide;
                  const perpZ = dirX * steerSide;

                  avoidanceForceX += perpX * steerIntensity;
                  avoidanceForceZ += perpZ * steerIntensity;

                  if (otherDist < AVOID_RADIUS) {
                    const repulseIntensity = ((AVOID_RADIUS - otherDist) / AVOID_RADIUS) * 0.7 * targetProximityDampener;
                    avoidanceForceX -= (toOtherX / otherDist) * repulseIntensity;
                    avoidanceForceZ -= (toOtherZ / otherDist) * repulseIntensity;
                  }
                }
              }
            }
          }
        }

        // ── 2. Évitement et contournement des meubles au sol (avec prise en compte des positions dynamiques HoverMenu) ──
        const isFurnitureCollisionsEnabled = useSceneStore.getState().layers.furnitureCollisions;
        if (isFurnitureCollisionsEnabled) {
          const furnitureObstacles = getActiveFurnitureObstacles();
          const currentDestObjId = currentInstruction.smartObjectId;

          for (const obs of furnitureObstacles) {
            // Si le meuble est la destination ciblée par l'action courante, ne pas l'éviter (pour s'y asseoir / interagir)
            if (currentDestObjId && obs.smartObjectIds && obs.smartObjectIds.includes(currentDestObjId)) {
              continue;
            }

            const toObsX = obs.x - currentX;
            const toObsZ = obs.z - currentZ;
            const obsDist = Math.hypot(toObsX, toObsZ);
            const obsLookahead = obs.radius + 40; // anticipation

            if (obsDist > 0.1 && obsDist < obsLookahead) {
              const forwardProj = toObsX * dirX + toObsZ * dirZ;

              if (forwardProj > 0) {
                const perpDist = Math.abs(-dirZ * toObsX + dirX * toObsZ);

                if (perpDist < obs.radius) {
                  const cross = dirX * toObsZ - dirZ * toObsX;
                  const steerSide = cross >= 0 ? -1 : 1;

                  const lateralWeight = Math.max(0.3, (obs.radius - perpDist) / obs.radius);
                  const proximityWeight = Math.max(0.3, (obsLookahead - obsDist) / obsLookahead);
                  const steerIntensity = 1.0 * lateralWeight * proximityWeight * targetProximityDampener;

                  avoidanceForceX += -dirZ * steerSide * steerIntensity;
                  avoidanceForceZ += dirX * steerSide * steerIntensity;
                }
              }
            }
          }
        }

        // Combiner la direction cible (qui conserve toujours un poids minimum fort pour continuer d'avancer vers la cible)
        let steerX = dirX + avoidanceForceX;
        let steerZ = dirZ + avoidanceForceZ;
        const steerLen = Math.hypot(steerX, steerZ);

        if (steerLen > 0.001) {
          steerX /= steerLen;
          steerZ /= steerLen;
        } else {
          steerX = dirX;
          steerZ = dirZ;
        }

        const moveDist = Math.min(SPEED * dt, dist);
        stateRef.current.x += steerX * moveDist;
        stateRef.current.z += steerZ * moveDist;

        // Rotation orientée vers la direction effective de déplacement (contournement fluide)
        const targetRot = Math.atan2(steerX, steerZ);
        
        // Shortest path rotation
        let rotDiff = targetRot - stateRef.current.rotY;
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;

        const maxRot = ROT_SPEED * dt;
        if (Math.abs(rotDiff) <= maxRot) {
            stateRef.current.rotY = targetRot;
        } else {
            stateRef.current.rotY += Math.sign(rotDiff) * maxRot;
        }
      }
    } else if (statusRef.current === 'INTERACTING') {
      // ── Gestion spéciale pour duo-zone (✨ Scène Duo) ──
      if (currentInstruction.smartObjectId === 'duo-zone') {
        // Session terminée ou terminée pour ce personnage
        if (duoSessionManager.isCompletedFor(_characterId)) {
          duoSessionManager.leaveDuoZone(_characterId);
          claimedSlotRef.current = null;
          duoRoleRef.current = null;
          duoInvitedRef.current = false;
          dynamicNavQueueRef.current = [];
          dynamicNavIndexRef.current = 0;
          statusRef.current = 'IDLE';
          if (!hasNavStep) {
            stepIndexRef.current++;
          }
          return update(dt);
        }

        const isWaiting = duoSessionManager.isWaitingPartner(_characterId);
        if (isWaiting) {
          duoWaitTimerRef.current += dt;
          stateRef.current.animation = duoRoleRef.current === 'roleA'
            ? 'animations/poses_idles/anim_female_standing_pose.glb'
            : 'animations/poses_idles/anim_female_standing_pose_1.glb';
          stateRef.current.rotY = 0;

          // À la moitié du délai (10s), appeler le PNJ le plus proche
          if (duoWaitTimerRef.current >= 10.0 && !duoInvitedRef.current) {
            duoInvitedRef.current = true;
            duoSessionManager.inviteNearestNpc(_characterId);
          }

          // Timeout de 20s si aucun partenaire n'arrive
          if (duoWaitTimerRef.current > 20.0) {
            appLog(_characterId, `⏳ Duo timeout : pas de partenaire, reprise du parcours`);
            duoSessionManager.leaveDuoZone(_characterId);
            claimedSlotRef.current = null;
            duoRoleRef.current = null;
            duoInvitedRef.current = false;
            dynamicNavQueueRef.current = [];
            dynamicNavIndexRef.current = 0;
            statusRef.current = 'IDLE';
            if (!hasNavStep) {
              stepIndexRef.current++;
            }
            return update(dt);
          }
          return stateRef.current;
        }

        // Ticker l'horloge centrale de la session (géré par le meneur rôle A)
        duoSessionManager.tickSession(_characterId, dt);

        const animState = duoSessionManager.getCurrentAnimState();
        if (animState && duoRoleRef.current) {
          const role = duoRoleRef.current;
          const clip = role === 'roleA' ? animState.clipA : animState.clipB;
          const pos = role === 'roleA' ? animState.posA : animState.posB;
          const rot = role === 'roleA' ? animState.rotA : animState.rotB;

          stateRef.current.animation = clip;
          stateRef.current.x = pos[0];
          stateRef.current.y = pos[1];
          stateRef.current.z = pos[2];
          stateRef.current.rotY = rot;
          return stateRef.current;
        }

        // Session terminée
        if (duoSessionManager.isCompletedFor(_characterId)) {
          duoSessionManager.leaveDuoZone(_characterId);
          claimedSlotRef.current = null;
          duoRoleRef.current = null;
          duoInvitedRef.current = false;
          dynamicNavQueueRef.current = [];
          dynamicNavIndexRef.current = 0;
          statusRef.current = 'IDLE';
          if (!hasNavStep) {
            stepIndexRef.current++;
          }
          return update(dt);
        }

        return stateRef.current;
      }

      // ── Gestion spéciale pour rotation continue 360° (Inspection Concierge) ──
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

      const target = resolveInstructionCoords(currentInstruction, startPosRef.current);
      stateRef.current.animation = currentInstruction.animation || target.anim || 'idle';
      if (target.ty !== undefined) {
        stateRef.current.y = target.ty;
      }
      
      const targetRotY = currentInstruction.rotY !== undefined ? currentInstruction.rotY : target.rotY;
      if (targetRotY !== undefined) {
        let rotDiff = targetRotY - stateRef.current.rotY;
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
        const maxRot = ROT_SPEED * dt;
        if (Math.abs(rotDiff) <= maxRot) {
            stateRef.current.rotY = targetRotY;
        } else {
            stateRef.current.rotY += Math.sign(rotDiff) * maxRot;
        }
      }

      timerRef.current -= dt;
      if (timerRef.current <= 0) {
        statusRef.current = 'IDLE';
        stateRef.current.y = startPosRef.current?.y ?? 0;
        if (hasNavStep) {
          dynamicNavIndexRef.current++;
          if (dynamicNavIndexRef.current >= dynamicNavQueueRef.current.length) {
            dynamicNavQueueRef.current = [];
            dynamicNavIndexRef.current = 0;
          }
        } else {
          stepIndexRef.current++;
          // Libérer le slot si l'étape suivante ne concerne plus le même objet
          const nextInstr = stepIndexRef.current < scenario.length ? scenario[stepIndexRef.current] : null;
          if (claimedSlotRef.current && (!nextInstr || nextInstr.smartObjectId !== claimedSlotRef.current.objectId)) {
            OccupancyManager.releaseSlot(claimedSlotRef.current.objectId, claimedSlotRef.current.slotId, _characterId);
            claimedSlotRef.current = null;
          }
        }
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

  return { update, setPosition, setRotation };
}
