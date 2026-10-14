import { cameraState } from '../../cameraState';
import { useSceneStore } from '../../store/useSceneStore';
import { getAgentProfile, hasAgentProfile } from '../navigation/obstacles';
import { inflate, CLEARANCE_ERROR, type Point, type Polygon } from '../navigation/geometry';

export interface SteeringResult { steerX: number; steerZ: number }
const SHARED_STEER: SteeringResult = { steerX: 0, steerZ: 0 };
const TWO_PI = 2 * Math.PI;
const destinations = new Map<string, Point>();
const passingSides = new Map<string, Map<string, number>>();

export function reserveAgentDestination(id: string, target: Point | null): void {
  if (target) destinations.set(id, { ...target });
  else {
    destinations.delete(id);
    passingSides.delete(id);
    for (const sides of passingSides.values()) sides.delete(id);
  }
}

/** A stopping place must fit both bodies, even when another actor is resting. */
export function isAgentDestinationFree(id: string, target: Point): boolean {
  const profile = getAgentProfile(id);
  for (const otherId in cameraState.positions) {
    if (otherId === id || !hasAgentProfile(otherId)) continue;
    const other = cameraState.positions[otherId];
    const body = getAgentProfile(otherId);
    const separation = profile.radius + body.radius;
    if (other.y >= profile.height || other.y + body.height <= 0) continue;
    if (Math.hypot(target.x - other.x, target.z - other.z) < separation) return false;
    const destination = destinations.get(otherId);
    if (destination && Math.hypot(target.x - destination.x, target.z - destination.z) < separation) return false;
  }
  return true;
}

/** Anticipate contact using measured bodies; keep the passing side for the encounter. */
export function computeSteeringVector(characterId: string, currentX: number, currentZ: number, dirX: number, dirZ: number, _distToTarget: number): SteeringResult {
  let steerX = dirX, steerZ = dirZ;
  if (useSceneStore.getState().layers.npcCollisions) {
    const profile = getAgentProfile(characterId);
    const y = cameraState.positions[characterId]?.y ?? 0;
    let sides = passingSides.get(characterId);
    if (!sides) { sides = new Map(); passingSides.set(characterId, sides); }
    for (const otherId in cameraState.positions) {
      if (otherId === characterId || !hasAgentProfile(otherId)) continue;
      const other = cameraState.positions[otherId], body = getAgentProfile(otherId);
      if (other.y >= y + profile.height || other.y + body.height <= y) continue;
      const dx = other.x - currentX, dz = other.z - currentZ;
      const distance = Math.hypot(dx, dz);
      const clearance = profile.radius + body.radius;
      const lookahead = clearance * 2;
      if (distance >= lookahead) { sides.delete(otherId); continue; }
      const forward = dx * dirX + dz * dirZ;
      const cross = dirX * dz - dirZ * dx;
      if (forward > 0 && Math.abs(cross) < clearance) {
        let side = sides.get(otherId);
        if (side === undefined) { side = cross > 0 ? -1 : 1; sides.set(otherId, side); }
        const proximity = (lookahead - distance) / clearance;
        const lateral = (clearance - Math.abs(cross)) / clearance;
        steerX -= dirZ * side * proximity * lateral;
        steerZ += dirX * side * proximity * lateral;
      }
      if (distance > 0 && distance < clearance) {
        const penetration = (clearance - distance) / clearance;
        steerX -= dx / distance * penetration;
        steerZ -= dz / distance * penetration;
      }
      // At contact, remove inward velocity so an actor can slide and separate.
      if (distance > 0 && distance <= clearance + CLEARANCE_ERROR) {
        const inward = (steerX * dx + steerZ * dz) / distance;
        if (inward >= 0) {
          const correction = inward + CLEARANCE_ERROR / clearance;
          steerX -= dx / distance * correction;
          steerZ -= dz / distance * correction;
        }
      }
    }
  }
  const length = Math.hypot(steerX, steerZ);
  SHARED_STEER.steerX = length > 0 ? steerX / length : dirX;
  SHARED_STEER.steerZ = length > 0 ? steerZ / length : dirZ;
  return SHARED_STEER;
}

/** Sweep the proposed step against solid actor bodies, without teleporting or tunnelling. */
export function limitAgentMovement(id: string, start: Point, proposed: Point): Point {
  if (!useSceneStore.getState().layers.npcCollisions) return proposed;
  const profile = getAgentProfile(id);
  const vx = proposed.x - start.x, vz = proposed.z - start.z;
  const lengthSquared = vx * vx + vz * vz;
  if (lengthSquared === 0) return proposed;
  const y = cameraState.positions[id]?.y ?? 0;
  let fraction = 1;
  for (const otherId in cameraState.positions) {
    if (otherId === id || !hasAgentProfile(otherId)) continue;
    const other = cameraState.positions[otherId], body = getAgentProfile(otherId);
    if (!(profile.solid || body.solid) || other.y >= y + profile.height || other.y + body.height <= y) continue;
    const dx = start.x - other.x, dz = start.z - other.z;
    const radius = profile.radius + body.radius;
    const b = dx * vx + dz * vz;
    const c = dx * dx + dz * dz - radius * radius;
    // Existing overlaps may separate, but must not deepen.
    if (c <= 0) {
      if (b < 0) fraction = 0;
      continue;
    }
    if (b >= 0) continue;
    const discriminant = b * b - lengthSquared * c;
    if (discriminant <= 0) continue;
    const contact = (-b - Math.sqrt(discriminant)) / lengthSquared;
    if (contact >= 0 && contact < fraction) fraction = Math.max(0, contact - Number.EPSILON);
  }
  return fraction === 1 ? proposed : { x: start.x + vx * fraction, z: start.z + vz * fraction };
}

/** Obstacles for a route around actors, using the same footprint as movement clearance. */
export function getAgentObstacles(id: string, start: Point): Polygon[] {
  if (!useSceneStore.getState().layers.npcCollisions) return [];
  const profile = getAgentProfile(id);
  const y = cameraState.positions[id]?.y ?? 0;
  const obstacles: Polygon[] = [];
  for (const otherId in cameraState.positions) {
    if (otherId === id || !hasAgentProfile(otherId)) continue;
    const other = cameraState.positions[otherId], body = getAgentProfile(otherId);
    if (!(profile.solid || body.solid) || other.y >= y + profile.height || other.y + body.height <= y) continue;
    const radius = profile.radius + body.radius;
    // Already intersecting actors must remain able to leave their shared space.
    if (Math.hypot(start.x - other.x, start.z - other.z) <= radius + CLEARANCE_ERROR) continue;
    obstacles.push(inflate([{ x: other.x, z: other.z }], radius));
  }
  return obstacles;
}

/** Smooth the shortest angular arc, bounded by the actor's turn speed in radians/s. */
export function computeRotYStep(currentRotY: number, targetRotY: number, rotSpeed: number, dt: number): number {
  let diff = (targetRotY - currentRotY) % TWO_PI;
  if (diff > Math.PI) diff -= TWO_PI;
  else if (diff < -Math.PI) diff += TWO_PI;
  const eased = diff * (1 - Math.exp(-rotSpeed * dt));
  const limit = rotSpeed * dt;
  return currentRotY + Math.max(-limit, Math.min(limit, eased));
}
