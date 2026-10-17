import { cameraState } from '../../cameraState';
import { useSceneStore } from '../../store/useSceneStore';
import { getAgentProfile, hasAgentProfile } from '../navigation/obstacles';
import { inflate, CLEARANCE_ERROR, BOOLEAN_PRECISION, GEOMETRY_EPSILON, pointInRing, projectToSegment, distance, type Point, type Polygon } from '../navigation/geometry';
import { duoSessionManager } from '../duoSessionManager';

export interface SteeringResult { steerX: number; steerZ: number }
const SHARED_STEER: SteeringResult = { steerX: 0, steerZ: 0 };
const TWO_PI = 2 * Math.PI;
// Keep only the central quarter of each body's radius solid against other actors.
// Partial body overlap is intentional in crowded rooms; furniture keeps full clearance.
export const ACTOR_AVOIDANCE_SCALE = 0.25;
export const actorClearance = (profile: { radius: number }, body: { radius: number }): number =>
  (profile.radius + body.radius) * ACTOR_AVOIDANCE_SCALE;
const destinations = new Map<string, Point>();
const passingSides = new Map<string, Map<string, number>>();
// Only actors which rejected a candidate invalidate a failed approach. Unrelated
// moving actors must not trigger expensive searches for an impossible geometry.
export type ActorBlockers = Map<string, string>;
const observedBlockers = new Map<string, ActorBlockers>();
function actorState(id: string): string {
  const p = cameraState.positions[id], d = destinations.get(id);
  return JSON.stringify([p?.x, p?.y, p?.z, hasAgentProfile(id) ? getAgentProfile(id) : null, d, duoSessionManager.getSessionFor(id)?.sessionId]);
}
export function beginActorBlockCheck(id: string): void { observedBlockers.set(id, new Map()); }
export function endActorBlockCheck(id: string): ActorBlockers {
  const blockers = observedBlockers.get(id) ?? new Map();
  observedBlockers.delete(id);
  return blockers;
}
export function actorBlocksUnchanged(blockers: ActorBlockers): boolean {
  if (!blockers.size) return true;
  return useSceneStore.getState().layers.npcCollisions && [...blockers].every(([id, state]) => actorState(id) === state);
}
const areDuoPartners = (id: string, otherId: string) => {
  const session = duoSessionManager.getSessionFor(id);
  return Boolean(session && session === duoSessionManager.getSessionFor(otherId));
};
const actorOverlap = (point: Point, center: Point, radius: number) =>
  distance(point, center) <= radius + CLEARANCE_ERROR + Math.SQRT2 * BOOLEAN_PRECISION
  && pointInRing(point, inflate([{ x:center.x, z:center.z }], radius));

export function reserveAgentDestination(id: string, target: Point | null): void {
  if (target) destinations.set(id, { ...target });
  else {
    destinations.delete(id);
    passingSides.delete(id);
    for (const sides of passingSides.values()) sides.delete(id);
  }
}

/** Stopping places use the same reduced actor footprint as movement and detours. */
export function isAgentDestinationFree(id: string, target: Point): boolean {
  if (!useSceneStore.getState().layers.npcCollisions) return true;
  const profile = getAgentProfile(id);
  for (const otherId in cameraState.positions) {
    if (otherId === id || !hasAgentProfile(otherId) || areDuoPartners(id, otherId)) continue;
    const other = cameraState.positions[otherId];
    const body = getAgentProfile(otherId);
    const separation = actorClearance(profile, body);
    if (other.y >= profile.height || other.y + body.height <= 0) continue;
    const destination = destinations.get(otherId);
    if (actorOverlap(target, other, separation) || destination && actorOverlap(target, destination, separation)) {
      observedBlockers.get(id)?.set(otherId, actorState(otherId));
      return false;
    }
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
      if (otherId === characterId || !hasAgentProfile(otherId) || areDuoPartners(characterId, otherId)) continue;
      const other = cameraState.positions[otherId], body = getAgentProfile(otherId);
      if (other.y >= y + profile.height || other.y + body.height <= y) continue;
      const dx = other.x - currentX, dz = other.z - currentZ;
      const distance = Math.hypot(dx, dz);
      const clearance = actorClearance(profile, body);
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

/** Sweep every actor body, without teleporting or tunnelling. */
export function limitAgentMovement(id: string, start: Point, proposed: Point): Point {
  if (!useSceneStore.getState().layers.npcCollisions) return proposed;
  const profile = getAgentProfile(id);
  const vx = proposed.x - start.x, vz = proposed.z - start.z;
  const lengthSquared = vx * vx + vz * vz;
  if (lengthSquared === 0) return proposed;
  const y = cameraState.positions[id]?.y ?? 0;
  let fraction = 1;
  for (const otherId in cameraState.positions) {
    if (otherId === id || !hasAgentProfile(otherId) || areDuoPartners(id, otherId)) continue;
    const other = cameraState.positions[otherId], body = getAgentProfile(otherId);
    if (other.y >= y + profile.height || other.y + body.height <= y) continue;
    const dx = start.x - other.x, dz = start.z - other.z;
    // Most actors are nowhere near this swept step; avoid constructing their polygons.
    const radius = actorClearance(profile, body);
    if (distance(other, projectToSegment(other, start, proposed)) > radius + CLEARANCE_ERROR + Math.SQRT2 * BOOLEAN_PRECISION) continue;
    const polygon = inflate([{ x: other.x, z: other.z }], radius);
    // Existing overlaps may separate, but must not deepen.
    if (pointInRing(start, polygon)) {
      if (dx * vx + dz * vz < 0) fraction = 0;
      continue;
    }
    // Clip the step against the very same convex footprint as the planner.
    // Boundary tangents are permitted; a transverse entry stops at contact.
    let enter = 0, leave = 1;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      const ex = b.x - a.x, ez = b.z - a.z;
      const side = ex * (start.z - a.z) - ez * (start.x - a.x);
      const slope = ex * vz - ez * vx;
      if (Math.abs(slope) <= GEOMETRY_EPSILON) {
        if (side <= GEOMETRY_EPSILON) { leave = 0; break; }
      } else {
        const contact = -side / slope;
        if (slope > 0) enter = Math.max(enter, contact);
        else leave = Math.min(leave, contact);
      }
    }
    if (enter < leave && leave > 0 && enter < fraction) fraction = Math.max(0, enter);
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
    if (otherId === id || !hasAgentProfile(otherId) || areDuoPartners(id, otherId)) continue;
    const other = cameraState.positions[otherId], body = getAgentProfile(otherId);
    if (other.y >= y + profile.height || other.y + body.height <= y) continue;
    const radius = actorClearance(profile, body);
    // Already intersecting actors must remain able to leave their shared space.
    const polygon = inflate([{ x: other.x, z: other.z }], radius);
    if (pointInRing(start, polygon)) continue;
    obstacles.push(polygon);
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
