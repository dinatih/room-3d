import { useRef, useEffect } from 'react';
import { AgentInstruction } from './aiTypes';
import { ZONES } from './ZoneNodes';
import { SMART_OBJECTS } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';
import { buildNavigationWaypoints, getRoomFromCoords } from './navigationGraph';
import { useSceneStore, resolveStoreKey } from '../store/useSceneStore';
import { appLog } from '@features/ui/AppConsole';

export interface AgentState {
  x: number;
  y: number;
  z: number;
  rotY: number;
  animation: string;
  isSpawned: boolean;
}

function resolveInstructionCoords(instr: AgentInstruction, startPos: { x: number; z: number } | null): { tx: number; ty?: number; tz: number; label: string; rotY?: number; anim?: string; duration?: number } {
  if (instr.type === 'RETURN_TO_START' && startPos) {
    return { tx: startPos.x, tz: startPos.z, label: 'point de départ' };
  }
  if (instr.smartObjectId && SMART_OBJECTS[instr.smartObjectId]) {
    const obj = SMART_OBJECTS[instr.smartObjectId];
    const slot = instr.slotId
      ? (obj.slots.find(s => s.slotId === instr.slotId) ?? obj.slots[0])
      : obj.slots[0];
    const pos = slot ? (slot.approachOffset ?? slot.offset) : obj.position;
    return {
      tx: pos[0],
      ty: pos[1],
      tz: pos[2],
      label: `${obj.name}${slot ? ` (${slot.name})` : ''}`,
      rotY: slot?.rotY,
      anim: slot?.animation,
      duration: slot?.duration
    };
  }
  if (instr.targetNodeId && ZONES[instr.targetNodeId]) {
    const node = ZONES[instr.targetNodeId];
    return { tx: node.x, tz: node.z, label: node.id };
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
  spawnDelay: number = 0
) {
  const stateRef = useRef<AgentState>({
    x: 0,
    y: 0,
    z: 0,
    rotY: 0,
    animation: 'idle',
    isSpawned: spawnDelay === 0
  });

  const stepIndexRef = useRef(0);
  const timerRef = useRef(0);
  const statusRef = useRef<'WAITING' | 'FALLING' | 'LANDING' | 'IDLE' | 'MOVING' | 'INTERACTING' | 'FINISHED'>(spawnDelay > 0 ? 'WAITING' : 'IDLE');
  const delayTimerRef = useRef(spawnDelay);
  const prevScenarioRef = useRef<AgentInstruction[] | null | undefined>(undefined);
  const startPosRef = useRef<{x: number, y: number, z: number, rotY: number} | null>(null);
  const claimedSlotRef = useRef<{ objectId: string; slotId: string } | null>(null);
  
  // Navigation dynamique inter-pièces
  const dynamicNavQueueRef = useRef<AgentInstruction[]>([]);
  const dynamicNavIndexRef = useRef(0);
  const activeNavStepIndexRef = useRef<number>(-1);

  // Ref pour éviter les logs dupliqués à chaque frame
  const lastLogRef = useRef<string>('');

  // Libérer toutes les réservations au démontage
  useEffect(() => {
    return () => {
      OccupancyManager.releaseAllForCharacter(_characterId);
    };
  }, [_characterId]);

  if (scenario !== prevScenarioRef.current) {
    if (claimedSlotRef.current) {
      OccupancyManager.releaseAllForCharacter(_characterId);
      claimedSlotRef.current = null;
    }
    stepIndexRef.current = 0;
    timerRef.current = 0;
    statusRef.current = spawnDelay > 0 ? 'WAITING' : 'IDLE';
    delayTimerRef.current = spawnDelay;
    prevScenarioRef.current = scenario;
    dynamicNavQueueRef.current = [];
    dynamicNavIndexRef.current = 0;
    activeNavStepIndexRef.current = -1;
    
    // Sync starting position with the actual character position when AI starts
    if (scenario) {
      const real = getRealPosition();
      stateRef.current.x = real.x;
      stateRef.current.y = spawnDelay > 0 ? 2500 : real.y;
      stateRef.current.z = real.z;
      stateRef.current.rotY = real.rotY;
      startPosRef.current = { x: real.x, y: real.y, z: real.z, rotY: real.rotY };
      if (spawnDelay > 0) {
        appLog(_characterId, `⏳ En attente de déploiement (${spawnDelay}s)...`);
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
        appLog(_characterId, `▶ Tombée du ciel`);
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
      stateRef.current.animation = 'media/sandbox/anims/anim_falling.glb';
      return stateRef.current;
    }

    if (statusRef.current === 'LANDING') {
      timerRef.current -= dt;
      if (timerRef.current <= 0) {
        statusRef.current = 'IDLE';
      }
      stateRef.current.animation = 'media/sandbox/anims/anim_crouch_to_stand.glb';
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
        
        if (OccupancyManager.isSlotOccupied(objId, reqSlotId, _characterId)) {
          // Place occupée : trouver un autre slot libre sur le même meuble si disponible (ex. autre siège d'un lit ou canapé)
          const altSlotId = OccupancyManager.getAvailableSlot(objId, _characterId, currentInstruction.slotId);
          if (altSlotId) {
            currentInstruction.slotId = altSlotId;
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
        const logKey = `move-${stepIndexRef.current}-${dynamicNavIndexRef.current}-${target.label}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          appLog(_characterId, `🚶‍♂️ Marche vers ${target.label} (${target.tx.toFixed(0)}, ${target.tz.toFixed(0)})`);
        }
      } else if (currentInstruction.type === 'INTERACT' || currentInstruction.type === 'WAIT') {
        statusRef.current = 'INTERACTING';
        const target = resolveInstructionCoords(currentInstruction, startPosRef.current);
        timerRef.current = currentInstruction.duration || target.duration || 1.0;
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
            const wantsToOpen = currentInstruction.triggerTargetState;
            if (wantsToOpen !== currentVal) {
              store.triggerAction(key);
            }
          } else {
            store.triggerAction(key);
          }
        }

        // Log action INTERACT
        const animation = currentInstruction.animation || target.anim || '';
        const duration = timerRef.current;
        const logKey = `interact-${stepIndexRef.current}-${dynamicNavIndexRef.current}-${animation}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          const label = animation
            ? animation.replace('media/sandbox/anims/', '').replace('.glb', '')
            : currentInstruction.type;
          appLog(_characterId, `🎭 Action: ${label} (${duration.toFixed(1)}s)`);
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

      if (dist < 2.0) {
        // Arrivé
        stateRef.current.x = tx;
        stateRef.current.z = tz;
        const arrivedKey = `arrived-${stepIndexRef.current}`;
        if (lastLogRef.current !== arrivedKey) {
          lastLogRef.current = arrivedKey;
          appLog(_characterId, `🎯 Arrivé à ${target.label}`);
        }

        // Si l'instruction est USE_OBJECT, on enchaîne directement sur l'interaction !
        if (currentInstruction.type === 'USE_OBJECT') {
          statusRef.current = 'INTERACTING';
          timerRef.current = currentInstruction.duration || target.duration || 1.0;
          if (currentInstruction.triggerEventKey) {
            let key = currentInstruction.triggerEventKey as any;
            if (key === 'eastGlassDoor' && useSceneStore.getState().furniture.bimDoubleDoor) {
              key = 'bimDoorRightOpen';
            }
            useSceneStore.getState().toggleFurniture(key);
          }
          const animation = currentInstruction.animation || target.anim || '';
          const duration = timerRef.current;
          const logKey = `interact-${stepIndexRef.current}-${animation}`;
          if (lastLogRef.current !== logKey) {
            lastLogRef.current = logKey;
            const label = animation
              ? animation.replace('media/sandbox/anims/', '').replace('.glb', '')
              : 'USE_OBJECT';
            appLog(_characterId, `🎭 Action: ${label} (${duration.toFixed(1)}s)`);
          }
        } else {
          statusRef.current = 'IDLE';
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
        stateRef.current.animation = 'walk';
        const moveDist = Math.min(SPEED * dt, dist);
        const dirX = dx / dist;
        const dirZ = dz / dist;
        stateRef.current.x += dirX * moveDist;
        stateRef.current.z += dirZ * moveDist;


        // Rotation
        const targetRot = Math.atan2(dirX, dirZ);
        
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
