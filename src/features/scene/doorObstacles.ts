/**
 * doorObstacles.ts — Moteur géométrique de détection de contact et de butée d'obstacles pour les portes.
 * 
 * Calcule la butée des meubles et l'angle nécessaire aux personnages présents.
 *
 * Fournit également l'état dynamique des battants pour l'évitement PNJ (agentAvoidance).
 */

import { cameraState } from './cameraState';
import { getActiveFurnitureObstacles } from './ai/furnitureObstacles';
import { ROOM_W, pX, pZ, DiagWall } from './wallData';

export const DOOR_OPEN_RESPONSE = 10;
export const DOOR_CLOSE_RESPONSE = 4;
export const HUMAN_BODY_RADIUS = 28;
export const HUMAN_BODY_HEIGHT = 173.4;

export interface CircleObstacle {
  x: number;
  z: number;
  radius: number;
  yMin?: number;
  yMax?: number;
}

export interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  yMin?: number;
  yMax?: number;
}

export interface DoorConfig {
  pivot: { x: number; z: number };
  length: number;
  thickness: number;
  closedDir: { x: number; z: number };   // Vecteur unitaire (direction fermé)
  openNormal: { x: number; z: number };  // Vecteur unitaire (sens d'ouverture à +90°)
  maxAngle: number;                      // Angle max absolu en radians
  yMin: number;
  yMax: number;
  margin: number;                        // Marge de sécurité (cm)
}

/**
 * État partagé des battants mobiles pour synchronisation inter-systèmes (PNJ, debug).
 */
export const doorCollisionState = {
  living: { angle: 0 },
  bath: { angle: 0 },
  entry: { angle: 0 },
  glassRight: { angle: 0 },
  glassLeft: { angle: 0 },
};

/**
 * Obstacles meubles statiques massifs rectangulaires le long des zones de débattement.
 */
const STATIC_BOX_OBSTACLES: BoxObstacle[] = [
  // Tour Kallax SE + Congélateur CHiQ (Mur B / Sud-Est)
  // X: face avant freezer à X = 273.5, Kallax SE à X = 277 (centre X = 296.5)
  // Z: Kallax SE [282, 357.5], Freezer [296, 344]
  {
    minX: 273.5,
    maxX: ROOM_W,
    minZ: 282,
    maxZ: 358,
    yMin: 0,
    yMax: 160,
  },
];

/**
 * Résout l'angle critique de contact entre un battant et un obstacle cylindrique.
 */
function testCircleCollision(door: DoorConfig, obs: CircleObstacle): number | null {
  if (obs.yMin !== undefined && obs.yMax !== undefined) {
    if (obs.yMax < door.yMin || obs.yMin > door.yMax) return null;
  }

  const vx = obs.x - door.pivot.x;
  const vz = obs.z - door.pivot.z;

  const v0 = vx * door.closedDir.x + vz * door.closedDir.z;
  const vPerp = vx * door.openNormal.x + vz * door.openNormal.z;
  const dist = Math.hypot(v0, vPerp);

  const rEff = obs.radius + door.thickness / 2 + door.margin;

  // Un obstacle centré derrière la charnière ne doit pas bloquer tout le battant
  // parce que son cercle simplifié recouvre le pivot.
  if (dist < rEff && v0 < 0) return null;
  if (dist > door.length + rEff) return null; // Trop loin
  if (dist < rEff) return 0; // Couvre le gond

  const alpha = Math.atan2(vPerp, v0);
  const sinBeta = Math.min(1, rEff / dist);
  const beta = Math.asin(sinBeta);

  // Cas 1 : Contact tangentiel sur la face du battant
  const tangentDist = dist * Math.cos(beta);
  if (tangentDist <= door.length) {
    const contactAngle = alpha - beta;
    if (contactAngle >= 0 && contactAngle <= door.maxAngle) {
      return contactAngle;
    }
    // Si l'obstacle chevauche déjà l'état fermé
    if (contactAngle < 0 && alpha + beta > 0) {
      return 0;
    }
  }

  // Cas 2 : Contact avec l'extrémité / tranche du battant
  if (dist - rEff <= door.length) {
    const L = door.length;
    const cosDelta = (L * L + dist * dist - rEff * rEff) / (2 * L * dist);
    if (cosDelta >= -1 && cosDelta <= 1) {
      const delta = Math.acos(cosDelta);
      const tipAngle = alpha - delta;
      if (tipAngle >= 0 && tipAngle <= door.maxAngle) {
        return tipAngle;
      }
    }
  }

  return null;
}

/**
 * Résout l'angle critique de contact entre un battant et une boîte AABB.
 */
function testBoxCollision(door: DoorConfig, box: BoxObstacle): number | null {
  if (box.yMax !== undefined && box.yMin !== undefined) {
    if (box.yMax < door.yMin || box.yMin > door.yMax) return null;
  }

  const hT = door.thickness / 2 + door.margin;
  const bMinX = box.minX - hT;
  const bMaxX = box.maxX + hT;
  const bMinZ = box.minZ - hT;
  const bMaxZ = box.maxZ + hT;

  const corners = [
    { x: bMinX, z: bMinZ },
    { x: bMaxX, z: bMinZ },
    { x: bMaxX, z: bMaxZ },
    { x: bMinX, z: bMaxZ },
  ];

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
  const edges = [
    { p1: corners[0], p2: corners[1] },
    { p1: corners[1], p2: corners[2] },
    { p1: corners[2], p2: corners[3] },
    { p1: corners[3], p2: corners[0] },
  ];

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
}

/**
 * Calcule la butée des meubles et la place nécessaire au passage des personnages.
 */
export function computeDoorDynamics(
  door: DoorConfig,
): DoorDynamicsResult {
  // 1. Meubles statiques massifs (butée stricte infranchissable)
  let furnitureMaxAngle = door.maxAngle;

  for (const box of STATIC_BOX_OBSTACLES) {
    const contact = testBoxCollision(door, box);
    if (contact !== null && contact < furnitureMaxAngle) {
      furnitureMaxAngle = contact;
    }
  }

  // 2. Meubles dynamiques (exclure le congélateur qui est déjà modélisé dans STATIC_BOX_OBSTACLES)
  const furniture = getActiveFurnitureObstacles();
  for (const f of furniture) {
    if (f.id === 'freezer') continue;
    const contact = testCircleCollision(door, {
      x: f.x,
      z: f.z,
      radius: f.radius,
      yMin: 0,
      yMax: 150,
    });
    if (contact !== null && contact < furnitureMaxAngle) {
      furnitureMaxAngle = contact;
    }
  }

  let push = 0;
  for (const id in cameraState.positions) {
    const p = cameraState.positions[id];
    const bodyRadius = id === 'robin' ? 7.5 : id === 'shiba' ? 20 : HUMAN_BODY_RADIUS;
    const height = id === 'robin' ? 15 : id === 'shiba' ? 40 : HUMAN_BODY_HEIGHT;
    if (p.y > door.yMax || p.y + height < door.yMin) continue;

    const vx = p.x - door.pivot.x;
    const vz = p.z - door.pivot.z;
    const along = vx * door.closedDir.x + vz * door.closedDir.z;
    const across = vx * door.openNormal.x + vz * door.openNormal.z;
    const clearance = bodyRadius + door.thickness / 2 + door.margin;
    const distance = Math.hypot(along, across);
    // Une présence dans l'arc de rotation ne suffit pas à rouvrir la porte après un passage.
    if (along < -clearance || along > door.length + clearance || distance > door.length + clearance || across > clearance) continue;

    // On the opposite side the leaf starts moving as the body reaches its plane.
    // On the opening side its outer tangent keeps the whole body clear until it exits.
    const angle = across < 0
      ? Math.asin(Math.min(1, Math.max(0, (clearance + across) / Math.max(clearance, along))))
      : distance <= clearance
        ? door.maxAngle
        : Math.atan2(across, along) + Math.asin(Math.min(1, clearance / distance));
    push = Math.max(push, Math.min(door.maxAngle, Math.max(0, angle)));
  }

  return { allowed: furnitureMaxAngle, push: Math.min(furnitureMaxAngle, push) };
}

/**
 * Calcule l'angle maximal autorisé pour une porte donnée compte tenu de tous les obstacles actifs.
 */
export function computeDoorAllowedAngle(door: DoorConfig): number {
  return computeDoorDynamics(door).allowed;
}

/**
 * Configurations préétablies pour les portes principales du modèle.
 */
export const DOOR_CONFIGS = {
  living: {
    pivot: { x: 284.5, z: 403.6 },
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
