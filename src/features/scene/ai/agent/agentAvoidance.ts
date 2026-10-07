import { cameraState } from '../../cameraState';
import { useSceneStore } from '../../store/useSceneStore';
import { getActiveFurnitureObstacles } from '../furnitureObstacles';
import { doorCollisionState, DOOR_CONFIGS, HUMAN_BODY_HEIGHT, HUMAN_BODY_RADIUS } from '../../doorObstacles';

export interface SteeringResult {
  steerX: number;
  steerZ: number;
}

const SHARED_STEER: SteeringResult = { steerX: 0, steerZ: 0 };
const TWO_PI = 2 * Math.PI;

/** Écarte un personnage lorsque le battant atteint sa position, même pendant une interaction. */
export function separateAgentFromDoors(position: { x: number; y: number; z: number }): void {
  for (const key of ['living', 'bath', 'entry', 'glassRight', 'glassLeft'] as const) {
    const angle = Math.abs(doorCollisionState[key].angle);
    if (angle === 0) continue;

    const door = DOOR_CONFIGS[key];
    if (position.y > door.yMax || position.y + HUMAN_BODY_HEIGHT < door.yMin) continue;

    const leafX = Math.cos(angle) * door.closedDir.x + Math.sin(angle) * door.openNormal.x;
    const leafZ = Math.cos(angle) * door.closedDir.z + Math.sin(angle) * door.openNormal.z;
    const along = (position.x - door.pivot.x) * leafX + (position.z - door.pivot.z) * leafZ;
    const nearest = Math.max(0, Math.min(door.length, along));
    const dx = position.x - (door.pivot.x + leafX * nearest);
    const dz = position.z - (door.pivot.z + leafZ * nearest);
    const distance = Math.hypot(dx, dz);
    const clearance = HUMAN_BODY_RADIUS + door.thickness / 2 + door.margin;
    if (distance >= clearance) continue;

    // La normale choisit le côté déjà occupé par le personnage.
    const normalX = distance > 0 ? dx / distance : door.openNormal.x;
    const normalZ = distance > 0 ? dz / distance : door.openNormal.z;
    position.x += normalX * (clearance - distance);
    position.z += normalZ * (clearance - distance);
  }
}

/**
 * Calcule la direction résultante (steerX, steerZ) en combinant la direction vers la cible
 * et les forces répulsives d'évitement des autres personnages et des meubles.
 * Réutilise une structure statique partagée pour zéro allocation d'objet par frame.
 */
export function computeSteeringVector(
  characterId: string,
  currentX: number,
  currentZ: number,
  dirX: number,
  dirZ: number,
  distToTarget: number,
  targetSmartObjectId?: string
): SteeringResult {
  let avoidanceForceX = 0;
  let avoidanceForceZ = 0;

  // Si nous sommes très proches du waypoint de destination (< 30 cm), réduire l'évitement pour garantir l'arrivée
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

  // ── 2. Évitement et contournement des meubles au sol ──
  const isFurnitureCollisionsEnabled = useSceneStore.getState().layers.furnitureCollisions;
  if (isFurnitureCollisionsEnabled) {
    const furnitureObstacles = getActiveFurnitureObstacles();
    const len = furnitureObstacles.length;

    for (let i = 0; i < len; i++) {
      const obs = furnitureObstacles[i];
      if (targetSmartObjectId && obs.smartObjectIds && obs.smartObjectIds.includes(targetSmartObjectId)) {
        continue;
      }

      const toObsX = obs.x - currentX;
      const toObsZ = obs.z - currentZ;
      const obsDist = Math.hypot(toObsX, toObsZ);
      const obsLookahead = obs.radius + 40;

      if (obsDist > 0.1 && obsDist < obsLookahead) {
        const forwardProj = toObsX * dirX + toObsZ * dirZ;

        if (forwardProj > 0) {
          const perpDist = Math.abs(-dirZ * toObsX + dirX * toObsZ);

          if (perpDist < obs.radius) {
            const cross = dirX * toObsZ - dirZ * toObsX;
            const steerSide = cross >= 0 ? -1 : 1;

            const lateralWeight = Math.max(0.3, (obs.radius - perpDist) / obs.radius);
            const proximityWeight = Math.max(0.3, (obsLookahead - obsDist) / obsLookahead);
            const steerIntensity = lateralWeight * proximityWeight * targetProximityDampener;

            avoidanceForceX += -dirZ * steerSide * steerIntensity;
            avoidanceForceZ += dirX * steerSide * steerIntensity;
          }
        }
      }
    }
  }

  // ── 3. Évitement des battants de portes ouverts ──
  const isDoorCollisionsEnabled = isFurnitureCollisionsEnabled;
  if (isDoorCollisionsEnabled) {
    for (const key of ['living', 'bath', 'entry', 'glassRight', 'glassLeft'] as const) {
      const d = doorCollisionState[key];
      const cfg = DOOR_CONFIGS[key];
      if (Math.abs(d.angle) < 0.1) continue;

      const angle = Math.abs(d.angle);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const dirLeafX = cosA * cfg.closedDir.x + sinA * cfg.openNormal.x;
      const dirLeafZ = cosA * cfg.closedDir.z + sinA * cfg.openNormal.z;

      for (const fraction of [0.4, 0.75, 1.0]) {
        const obsX = cfg.pivot.x + dirLeafX * cfg.length * fraction;
        const obsZ = cfg.pivot.z + dirLeafZ * cfg.length * fraction;
        const obsRadius = 22;

        const toObsX = obsX - currentX;
        const toObsZ = obsZ - currentZ;
        const obsDist = Math.hypot(toObsX, toObsZ);
        const obsLookahead = obsRadius + 35;

        if (obsDist > 0.1 && obsDist < obsLookahead) {
          const forwardProj = toObsX * dirX + toObsZ * dirZ;
          if (forwardProj > 0) {
            const perpDist = Math.abs(-dirZ * toObsX + dirX * toObsZ);
            if (perpDist < obsRadius) {
              const cross = dirX * toObsZ - dirZ * toObsX;
              const steerSide = cross >= 0 ? -1 : 1;
              const lateralWeight = Math.max(0.3, (obsRadius - perpDist) / obsRadius);
              const proximityWeight = Math.max(0.3, (obsLookahead - obsDist) / obsLookahead);
              const steerIntensity = lateralWeight * proximityWeight * targetProximityDampener;

              avoidanceForceX += -dirZ * steerSide * steerIntensity;
              avoidanceForceZ += dirX * steerSide * steerIntensity;
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
