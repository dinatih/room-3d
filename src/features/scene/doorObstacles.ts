/**
 * doorObstacles.ts — Moteur géométrique de détection de contact et de butée d'obstacles pour les portes.
 * 
 * Calcule la butée des meubles et l'angle nécessaire aux personnages présents.
 *
 * Fournit également l'état dynamique des battants pour l'évitement PNJ (agentAvoidance).
 */

import { cameraState } from './cameraState';
import { furnitureObstacles, getObstacleRevision, getAgentProfile, hasAgentProfile, NAVIGATION_RADIUS_CM } from './ai/navigation/obstacles';
import { inflate, pointInRing, rectangle, CLEARANCE_ERROR, type Polygon } from './ai/navigation/geometry';
import { getDoorProtections, getDoorProtectionRevision, type DoorKey, type DoorProtection } from './ai/navigation/doorRequests';
import { pX, pZ, DiagWall, BATH_WEST_WALL, SHOWER_SOUTH_WALL } from './wallData';

export const HUMAN_BODY_RADIUS = 28;
export const HUMAN_BODY_HEIGHT = 173.4;
/** Physical leaf contacts must resolve the millimetre gaps around closed doors. */
const DOOR_CONTACT_ERROR = 0.1;

export interface DoorConfig {
  pivot: { x: number; z: number };
  length: number;
  thickness: number;
  closedDir: { x: number; z: number };   // Vecteur unitaire (direction fermé)
  openNormal: { x: number; z: number };  // Vecteur unitaire (sens d'ouverture à +90°)
  maxAngle: number;                      // Angle max absolu en radians
  yMin: number;
  yMax: number;
  margin: number;                        // Marge mécanique contre le mobilier (cm), pas autour des PNJ.
}

export function doorPolygon(key: DoorKey, angle: number): Polygon {
  const d = DOOR_CONFIGS[key], c = Math.cos(Math.abs(angle)), s = Math.sin(Math.abs(angle));
  const dx = c * d.closedDir.x + s * d.openNormal.x, dz = c * d.closedDir.z + s * d.openNormal.z;
  return rectangle(d.pivot.x + dx * d.length / 2, d.pivot.z + dz * d.length / 2, d.length, d.thickness, Math.atan2(-dz, dx));
}

/**
 * État partagé des battants mobiles pour synchronisation inter-systèmes (PNJ, debug).
 */
export const glassShutterState = { clearHeight: 210 };
/** Live animation commands, sampled with navigation stops and world snapshots. */
export const glassDoorState = {
  right: { allowed: Math.PI / 2, push: 0, minimum: 0, target: 0, manualOpen: false },
  left: { allowed: Math.PI / 2, push: 0, minimum: 0, target: 0, manualOpen: false },
  rightClearsLeft: false, shutterPercent: 0, targetShutter: 0,
};

export const doorCollisionState = {
  living: { angle: 0 },
  bath: { angle: 0 },
  entry: { angle: 0 },
  glassRight: { angle: 0 },
  glassLeft: { angle: 0 },
  shower: { angle: 0 },
};

/**
 * Résout l'angle critique de contact entre un battant et un obstacle cylindrique.
 */
/**
 * Résout l'angle critique de contact entre un battant et une boîte AABB.
 */
export function getDoorContactAngle(door: DoorConfig, polygon: Polygon, margin = door.margin): number | null {
  const corners = inflate(polygon, door.thickness / 2 + margin, DOOR_CONTACT_ERROR);
  // Furniture keeps its mechanical margin; actor protections pass zero margin.
  let earliestContact: number | null = null;

  // 1. Test des 4 sommets de la boîte
  for (const c of corners) {
    const vx = c.x - door.pivot.x;
    const vz = c.z - door.pivot.z;
    const dist = Math.hypot(vx, vz);

    if (dist <= door.length) {
      const v0 = vx * door.closedDir.x + vz * door.closedDir.z;
      const vPerp = vx * door.openNormal.x + vz * door.openNormal.z;
      const angle = Math.atan2(vPerp, v0);

      if (angle >= 0 && angle <= door.maxAngle) {
        if (earliestContact === null || angle < earliestContact) {
          earliestContact = angle;
        }
      }
    }
  }

  // 2. Test d'intersection de l'arc de l'extrémité avec les 4 segments de la boîte
  const edges = corners.map((p1, i) => ({ p1, p2: corners[(i + 1) % corners.length] }));

  for (const { p1, p2 } of edges) {
    // Équation de distance pour intersection segment-cercle
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const fx = p1.x - door.pivot.x;
    const fz = p1.z - door.pivot.z;

    const a = dx * dx + dz * dz;
    const b = 2 * (fx * dx + fz * dz);
    const cVal = fx * fx + fz * fz - door.length * door.length;

    const discr = b * b - 4 * a * cVal;
    if (discr >= 0) {
      const sqrtD = Math.sqrt(discr);
      const tValues = [(-b - sqrtD) / (2 * a), (-b + sqrtD) / (2 * a)];

      for (const t of tValues) {
        if (t >= 0 && t <= 1) {
          const ix = p1.x + t * dx;
          const iz = p1.z + t * dz;
          const vx = ix - door.pivot.x;
          const vz = iz - door.pivot.z;
          const v0 = vx * door.closedDir.x + vz * door.closedDir.z;
          const vPerp = vx * door.openNormal.x + vz * door.openNormal.z;
          const angle = Math.atan2(vPerp, v0);

          if (angle >= 0 && angle <= door.maxAngle) {
            if (earliestContact === null || angle < earliestContact) {
              earliestContact = angle;
            }
          }
        }
      }
    }
  }

  return earliestContact;
}

export interface DoorDynamicsResult {
  allowed: number;
  push: number;
  minimum: number;
}

/**
 * Calcule la butée des meubles et la place nécessaire au passage des personnages.
 */
export function computeDoorDynamics(
  door: DoorConfig,
  currentAngle: number,
): DoorDynamicsResult {
  const furnitureMaxAngle = computeDoorAllowedAngle(door);

  let push = 0, minimum = 0, maximum = furnitureMaxAngle;
  for (const id in cameraState.positions) {
    const p = cameraState.positions[id];
    const height = hasAgentProfile(id) ? getAgentProfile(id).height : (id === 'robin' ? 15 : HUMAN_BODY_HEIGHT);
    if (p.y > door.yMax || p.y + height < door.yMin) continue;

    const vx = p.x - door.pivot.x;
    const vz = p.z - door.pivot.z;
    const along = vx * door.closedDir.x + vz * door.closedDir.z;
    const across = vx * door.openNormal.x + vz * door.openNormal.z;
    const clearance = NAVIGATION_RADIUS_CM + door.thickness / 2;
    const distance = Math.hypot(along, across);
    // Keep the leaf on its current side of each body, in both directions.
    // Hard limits also stop spring momentum from crossing a stationary actor.
    if (across >= 0 && distance <= door.length + clearance) {
      const bearing = Math.atan2(across, along);
      const tangent = Math.asin(Math.min(1, (clearance + CLEARANCE_ERROR) / distance));
      if (Math.abs(currentAngle) >= bearing) minimum = Math.max(minimum, Math.min(door.maxAngle, bearing + tangent));
      else maximum = Math.min(maximum, Math.max(0, bearing - tangent));
    }
    // Les deux battants vitrés se partagent la même ouverture : une présence
    // devant le droit ne doit pas aussi pousser le gauche au-delà de leur jonction.
    const isGlassLeaf = door === DOOR_CONFIGS.glassLeft || door === DOOR_CONFIGS.glassRight;
    const minAlong = isGlassLeaf ? 0 : -clearance;
    const maxAlong = isGlassLeaf ? door.length : door.length + clearance;
    // Une présence dans l'arc de rotation ne suffit pas à rouvrir la porte après un passage.
    if (along < minAlong || along > maxAlong || distance > door.length + clearance || across > clearance) continue;

    // On the opposite side the leaf starts moving as the body reaches its plane.
    // On the opening side its outer tangent keeps the whole body clear until it exits.
    const angle = across < 0
      ? Math.asin(Math.min(1, Math.max(0, (clearance + across) / Math.max(clearance, along))))
      : distance <= clearance
        ? door.maxAngle
        : Math.atan2(across, along) + Math.asin(Math.min(1, clearance / distance));
    push = Math.max(push, Math.min(door.maxAngle, Math.max(0, angle)));
  }

  return { allowed: maximum, push: Math.min(maximum, push), minimum: Math.min(maximum, minimum) };
}

/**
 * Calcule l'angle maximal autorisé pour une porte donnée compte tenu de tous les obstacles actifs.
 */
const allowedAngles = new WeakMap<DoorConfig, { revision: number; protectionRevision: number; angle: number;
  contacts: { obstacle?: string; protection?: DoorProtection; angle: number }[] }>();
export function computeDoorAllowedAngle(door: DoorConfig): number {
  const revision = getObstacleRevision();
  const protectionRevision = getDoorProtectionRevision();
  const cached = allowedAngles.get(door);
  if (cached?.revision === revision && cached.protectionRevision === protectionRevision) return cached.angle;
  let furnitureMaxAngle = door.maxAngle;
  const contacts: { obstacle?: string; protection?: DoorProtection; angle: number }[] = [];
  for (const obstacle of furnitureObstacles.values()) {
    if (obstacle.yMax < door.yMin || obstacle.yMin > door.yMax) continue;
    // A leaf already touching a massive object cannot swing through it.
    const c = door.closedDir;
    const closedCenter = { x: door.pivot.x + c.x * door.length / 2, z: door.pivot.z + c.z * door.length / 2 };
    if (pointInRing(closedCenter, obstacle.polygon)) {
      furnitureMaxAngle = 0;
      contacts.push({ obstacle: obstacle.owner ?? obstacle.id, angle: 0 });
      continue;
    }
    const contact = getDoorContactAngle(door, obstacle.polygon);
    if (contact !== null) { furnitureMaxAngle = Math.min(furnitureMaxAngle, contact); contacts.push({ obstacle: obstacle.owner ?? obstacle.id, angle: contact }); }
  }

  const key = doorKeysByConfig.get(door);
  if (key) for (const body of getDoorProtections(key)) {
    if (body.y + body.height <= door.yMin || body.y >= door.yMax) continue;
    const polygon = inflate([{ x: body.x, z: body.z }], NAVIGATION_RADIUS_CM);
    const closedCenter = { x: door.pivot.x + door.closedDir.x * door.length / 2, z: door.pivot.z + door.closedDir.z * door.length / 2 };
    const contact = pointInRing(closedCenter, polygon) ? 0 : getDoorContactAngle(door, polygon, 0);
    if (contact !== null) { furnitureMaxAngle = Math.min(furnitureMaxAngle, contact); contacts.push({ protection: body, angle: contact }); }
  }
  allowedAngles.set(door, { revision, protectionRevision, angle: furnitureMaxAngle, contacts });
  return furnitureMaxAngle;
}

export function getDoorLimitDiagnostics(key: DoorKey) {
  const door = DOOR_CONFIGS[key];
  computeDoorAllowedAngle(door);
  return allowedAngles.get(door)!;
}

/**
 * Configurations préétablies pour les portes principales du modèle.
 */
export const DOOR_CONFIGS = {
  shower: {
    pivot: { x: BATH_WEST_WALL + 20, z: SHOWER_SOUTH_WALL - 71 },
    length: 51, thickness: 2,
    closedDir: { x: 1, z: 0 }, openNormal: { x: 0, z: -1 },
    maxAngle: Math.PI * 0.47, yMin: 20, yMax: 220, margin: 1.5,
  } satisfies DoorConfig,

  living: {
    pivot: { x: (pX('door-living-w') + pX('door-living-e')) / 2 + 83 / 2, z: pZ('door-living-w') },
    length: 83,
    thickness: 4,
    closedDir: { x: -1, z: 0 },
    openNormal: { x: 0, z: -1 }, // Pivote vers le séjour (Z négatif)
    maxAngle: Math.PI / 2,
    yMin: 0,
    yMax: 204,
    margin: 1.5,
  } satisfies DoorConfig,

  bath: {
    pivot: { x: pX('door-bath-n'), z: (pZ('door-bath-n') + pZ('door-bath-s')) / 2 + 83 / 2 },
    length: 83, thickness: 4,
    closedDir: { x: 0, z: -1 }, openNormal: { x: -1, z: 0 },
    maxAngle: Math.PI / 2, yMin: 0, yMax: 204, margin: 1.5,
  } satisfies DoorConfig,

  entry: (() => {
    const center = DiagWall.p(DiagWall.door.start + DiagWall.door.width / 2, 5);
    const rotation = DiagWall.rotY - Math.PI / 2;
    return {
      pivot: {
        x: center.x - DiagWall.door.width / 2 * Math.cos(rotation),
        z: center.z + DiagWall.door.width / 2 * Math.sin(rotation),
      },
      length: 90, thickness: 4,
      closedDir: { x: Math.cos(rotation), z: -Math.sin(rotation) },
      openNormal: { x: Math.sin(rotation), z: Math.cos(rotation) },
      maxAngle: 2 * Math.PI / 3, yMin: 0, yMax: 204, margin: 1.5,
    } satisfies DoorConfig;
  })(),

  glassRight: {
    pivot: { x: 252.5, z: 0 },
    length: 75,
    thickness: 5.5,
    closedDir: { x: -1, z: 0 },
    openNormal: { x: 0, z: 1 },  // Pivote vers le séjour (Z positif)
    maxAngle: Math.PI / 2,
    yMin: 20,
    yMax: 210,
    margin: 3.0,
  } satisfies DoorConfig,

  glassLeft: {
    pivot: { x: 102.5, z: 0 },
    length: 75,
    thickness: 5.5,
    closedDir: { x: 1, z: 0 },
    openNormal: { x: 0, z: 1 },  // Pivote vers le séjour (Z positif)
    maxAngle: Math.PI / 2,
    yMin: 20,
    yMax: 210,
    margin: 3.0,
  } satisfies DoorConfig,
};
const doorKeysByConfig = new Map<DoorConfig, DoorKey>(Object.entries(DOOR_CONFIGS).map(([key, config]) => [config, key as DoorKey]));
