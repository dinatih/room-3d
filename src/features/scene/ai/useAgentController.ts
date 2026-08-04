import { useRef } from 'react';
import { AgentInstruction } from './aiTypes';
import { ZONES } from './ZoneNodes';
import { useSceneStore } from '../store/useSceneStore';

export interface AgentState {
  x: number;
  z: number;
  rotY: number;
  animation: string;
}

export function useAgentController(
  _characterId: string,
  initialPos: [number, number],
  initialRot: number,
  scenario: AgentInstruction[] | null,
  loop: boolean = false
) {
  const stateRef = useRef<AgentState>({
    x: initialPos[0],
    z: initialPos[1],
    rotY: initialRot,
    animation: 'idle'
  });

  const stepIndexRef = useRef(0);
  const timerRef = useRef(0);
  const statusRef = useRef<'IDLE' | 'MOVING' | 'INTERACTING'>('IDLE');

  // Vitesse de déplacement (cm par seconde)
  const SPEED = 100;
  // Vitesse de rotation (radians par seconde)
  const ROT_SPEED = 5;

  const update = (dt: number) => {
    if (!scenario) {
      stateRef.current.animation = 'idle';
      return stateRef.current;
    }

    if (stepIndexRef.current >= scenario.length) {
      if (loop) {
        stepIndexRef.current = 0; // Boucler le scénario
      } else {
        stateRef.current.animation = 'idle';
        return stateRef.current;
      }
    }

    const currentInstruction = scenario[stepIndexRef.current];

    if (statusRef.current === 'IDLE') {
      if (currentInstruction.type === 'MOVE_TO') {
        statusRef.current = 'MOVING';
      } else if (currentInstruction.type === 'INTERACT' || currentInstruction.type === 'WAIT') {
        statusRef.current = 'INTERACTING';
        timerRef.current = currentInstruction.duration || 1.0;
        if (currentInstruction.triggerEventKey) {
          useSceneStore.getState().toggleFurniture(currentInstruction.triggerEventKey as any);
        }
      }
    }

    if (statusRef.current === 'MOVING') {
      let tx = stateRef.current.x;
      let tz = stateRef.current.z;

      if (currentInstruction.targetNodeId && ZONES[currentInstruction.targetNodeId]) {
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
