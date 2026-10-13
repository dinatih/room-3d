import { cameraState } from '../../cameraState';
import { useSceneStore } from '../../store/useSceneStore';

export interface SteeringResult {
  steerX: number;
  steerZ: number;
}

const SHARED_STEER: SteeringResult = { steerX: 0, steerZ: 0 };
const TWO_PI = 2 * Math.PI;

/**
 * Calcule la direction résultante (steerX, steerZ) en combinant la direction vers la cible
 * et l’évitement local des autres personnages. Les obstacles solides sont traités par la navigation.
 * Réutilise une structure statique partagée pour zéro allocation d'objet par frame.
 */
export function computeSteeringVector(
  characterId: string,
  currentX: number,
  currentZ: number,
  dirX: number,
  dirZ: number,
  distToTarget: number
): SteeringResult {
  let avoidanceForceX = 0;
  let avoidanceForceZ = 0;

  // Si nous sommes très proches de la destination (< 30 cm), réduire l'évitement pour garantir l'arrivée
  const targetProximityDampener = distToTarget < 30.0 ? distToTarget / 30.0 : 1.0;

  // ── 1. Évitement et contournement des autres personnages (NPCs et joueur) ──
  const isNpcCollisionsEnabled = useSceneStore.getState().layers.npcCollisions;
  if (isNpcCollisionsEnabled) {
    const AVOID_RADIUS = 35;
    const LOOKAHEAD_DIST = 70;
    const positions = cameraState.positions;

    for (const otherId in positions) {
      if (otherId === characterId) continue;
      const pos = positions[otherId];
      if (!pos) continue;

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
            const steerIntensity = lateralWeight * proximityWeight * targetProximityDampener;

            avoidanceForceX += -dirZ * steerSide * steerIntensity;
            avoidanceForceZ += dirX * steerSide * steerIntensity;

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

  SHARED_STEER.steerX = steerX;
  SHARED_STEER.steerZ = steerZ;
  return SHARED_STEER;
}

/**
 * Calcule l'incrément de rotation pour s'orienter de manière fluide vers targetRotY.
 * Utilise une normalisation angulaire directe sans boucle while.
 */
export function computeRotYStep(currentRotY: number, targetRotY: number, rotSpeed: number, dt: number): number {
  let rotDiff = (targetRotY - currentRotY) % TWO_PI;
  if (rotDiff > Math.PI) rotDiff -= TWO_PI;
  else if (rotDiff < -Math.PI) rotDiff += TWO_PI;

  const maxRot = rotSpeed * dt;
  if (Math.abs(rotDiff) <= maxRot) {
    return targetRotY;
  }
  return currentRotY + Math.sign(rotDiff) * maxRot;
}
