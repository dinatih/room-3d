import { useRef } from 'react';
import { AgentInstruction } from './aiTypes';
import { ZONES } from './ZoneNodes';
import { useSceneStore } from '../store/useSceneStore';
import { appLog } from '@features/ui/AppConsole';

export interface AgentState {
  x: number;
  y: number;
  z: number;
  rotY: number;
  animation: string;
  isSpawned: boolean;
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
  // Ref pour éviter les logs dupliqués à chaque frame
  const lastLogRef = useRef<string>('');

  if (scenario !== prevScenarioRef.current) {
    stepIndexRef.current = 0;
    timerRef.current = 0;
    statusRef.current = spawnDelay > 0 ? 'WAITING' : 'IDLE';
    delayTimerRef.current = spawnDelay;
    prevScenarioRef.current = scenario;
    
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

    if (stepIndexRef.current >= scenario.length) {
      if (loop) {
        stepIndexRef.current = 0; // Boucler le scénario
        // Log de rebouclage, une seule fois par cycle
        const loopKey = `loop-${_characterId}`;
        if (lastLogRef.current !== loopKey) {
          lastLogRef.current = loopKey;
          appLog(_characterId, '🔄 Nouveau scénario aléatoire');
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

    const currentInstruction = scenario[stepIndexRef.current];

    if (statusRef.current === 'IDLE') {
      if (currentInstruction.type === 'MOVE_TO' || currentInstruction.type === 'RETURN_TO_START') {
        statusRef.current = 'MOVING';
        // Log départ MOVE_TO
        let tx = stateRef.current.x;
        let tz = stateRef.current.z;
        if (currentInstruction.type === 'RETURN_TO_START' && startPosRef.current) {
          tx = startPosRef.current.x;
          tz = startPosRef.current.z;
        } else if (currentInstruction.targetNodeId && ZONES[currentInstruction.targetNodeId]) {
          const node = ZONES[currentInstruction.targetNodeId];
          tx = node.x;
          tz = node.z;
        } else if (currentInstruction.targetPos) {
          tx = currentInstruction.targetPos[0];
          tz = currentInstruction.targetPos[2];
        }
        const targetNodeId = currentInstruction.targetNodeId ?? 'pos';
        const logKey = `move-${stepIndexRef.current}-${targetNodeId}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          appLog(_characterId, `🚶‍♂️ Marche vers ${targetNodeId} (${tx.toFixed(0)}, ${tz.toFixed(0)})`);
        }
      } else if (currentInstruction.type === 'INTERACT' || currentInstruction.type === 'WAIT') {
        statusRef.current = 'INTERACTING';
        timerRef.current = currentInstruction.duration || 1.0;
        if (currentInstruction.triggerEventKey) {
          const key = currentInstruction.triggerEventKey as any;
          const currentVal = (useSceneStore.getState().furniture as any)[key];
          const isDoor = key.toLowerCase().includes('door');
          
          if (isDoor) {
            const wantsToOpen = currentInstruction.animation?.includes('open_door');
            if (wantsToOpen && !currentVal) {
              useSceneStore.getState().toggleFurniture(key);
            } else if (!wantsToOpen && currentVal) {
              // Si un perso ferme la porte (wantsToOpen=false), on la ferme uniquement si elle est ouverte
              useSceneStore.getState().toggleFurniture(key);
            }
          } else {
            useSceneStore.getState().toggleFurniture(key);
          }
        }
        // Log action INTERACT
        const animation = currentInstruction.animation ?? '';
        const duration = currentInstruction.duration ?? 1.0;
        const logKey = `interact-${stepIndexRef.current}-${animation}`;
        if (lastLogRef.current !== logKey) {
          lastLogRef.current = logKey;
          const label = animation
            ? animation.replace('media/sandbox/anims/', '').replace('.glb', '')
            : currentInstruction.type;
          appLog(_characterId, `🎭 Action: ${label} (${duration}s)`);
        }
      }
    }

    if (statusRef.current === 'MOVING') {
      let tx = stateRef.current.x;
      let tz = stateRef.current.z;

      if (currentInstruction.type === 'RETURN_TO_START' && startPosRef.current) {
        tx = startPosRef.current.x;
        tz = startPosRef.current.z;
      } else if (currentInstruction.targetNodeId && ZONES[currentInstruction.targetNodeId]) {
        const node = ZONES[currentInstruction.targetNodeId];
        tx = node.x;
        tz = node.z;
      } else if (currentInstruction.targetPos) {
        tx = currentInstruction.targetPos[0];
        tz = currentInstruction.targetPos[2];
      }

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
          const targetNodeId = currentInstruction.targetNodeId ?? 'destination';
          appLog(_characterId, `🎯 Arrivé à ${targetNodeId}`);
        }
        statusRef.current = 'IDLE';
        stepIndexRef.current++;
        stateRef.current.animation = 'idle';
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
      stateRef.current.animation = currentInstruction.animation || 'idle';
      
      if (currentInstruction.rotY !== undefined) {
        let rotDiff = currentInstruction.rotY - stateRef.current.rotY;
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
        const maxRot = ROT_SPEED * dt;
        if (Math.abs(rotDiff) <= maxRot) {
            stateRef.current.rotY = currentInstruction.rotY;
        } else {
            stateRef.current.rotY += Math.sign(rotDiff) * maxRot;
        }
      }

      timerRef.current -= dt;
      if (timerRef.current <= 0) {
        statusRef.current = 'IDLE';
        stepIndexRef.current++;
      }
    }

    return stateRef.current;
  };

  return { update };
}
