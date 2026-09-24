/**
 * doorObstacles.ts — Moteur géométrique de détection de contact et de butée d'obstacles pour les portes.
 * 
 * Calcule l'angle maximal d'ouverture avant collision avec :
 * 1. Meubles statiques (Kallax SE, congélateur CHiQ, cloisons)
 * 2. Meubles dynamiques du HoverMenu (Air Performer, chaises Smörkull, bureaux)
 * 3. Personnages PNJ en mouvement ou stationnaires (cameraState.positions)
 *
 * Fournit également l'état dynamique des battants pour l'évitement PNJ (agentAvoidance).
 */

import { cameraState } from './cameraState';
import { getActiveFurnitureObstacles } from './ai/furnitureObstacles';
import { ROOM_W } from '@config';

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
  living: { angle: 0, isOpen: false, pivot: { x: 284.5, z: 403.6 }, length: 83, normal: { x: 0, z: -1 } },
  glassRight: { angle: 0, isOpen: false, pivot: { x: 252.5, z: 0 }, length: 75, normal: { x: 0, z: 1 } },
  glassLeft: { angle: 0, isOpen: false, pivot: { x: 102.5, z: 0 }, length: 75, normal: { x: 0, z: 1 } },
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
 * Calcule dynamiquement les contraintes angulaires d'une porte (angle max autorisé et poussée PNJ)
 * en évitant strictement l'effet d'aspiration lorsqu'une porte est déjà ouverte.
 */
export function computeDoorDynamics(
  door: DoorConfig,
  currentAngle: number = 0
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

  let minAllowed = furnitureMaxAngle;
  let maxPush = 0;

  // 3. Personnages PNJ actifs (cameraState.positions)
  const npcs = cameraState.positions;
  for (const id in npcs) {
    const p = npcs[id];
    if (!p) continue;

    const vx = p.x - door.pivot.x;
    const vz = p.z - door.pivot.z;
    const v0 = vx * door.closedDir.x + vz * door.closedDir.z;
    const vPerp = vx * door.openNormal.x + vz * door.openNormal.z;
    const dist = Math.hypot(v0, vPerp);
    const rEff = 28 + door.thickness / 2 + door.margin; // 28 cm rayon PNJ

    if (dist > door.length + rEff || dist < 5) continue;

    const alpha = Math.atan2(vPerp, v0);
    const sinBeta = Math.min(1, rEff / dist);
    const beta = Math.asin(sinBeta);

    const contactFront = Math.max(0, alpha - beta);
    const contactBack = alpha + beta;

    // A. Blocage et refoulement dynamique de la porte :
    if (contactFront <= furnitureMaxAngle && contactBack >= 0) {
      // Zone de passage du chambranle (alpha < 0.80 rad / ~46°) vs zone ouverte / meuble (alpha >= 0.80 rad, ex: congélateur CHiQ)
      const isDoorwayPassage = alpha < 0.80;

      if (!isDoorwayPassage) {
        // Dans la zone ouverte (devant le congélateur / Kallax SE) :
        // Le corps du PNJ repousse le battant (effet repoussoir) pour éviter que la porte ne le traverse !
        if (contactFront < minAllowed) {
          minAllowed = contactFront;
        }
      } else {
        // Dans le passage du chambranle :
        // Ne bloque l'ouverture que si la porte s'ouvre vers le PNJ (currentAngle < contactFront - 0.05).
        // Si la porte est déjà ouverte au-delà, le PNJ qui traverse n'aspire JAMAIS le battant vers lui.
        if (currentAngle < contactFront - 0.05) {
          if (contactFront < minAllowed) {
            minAllowed = contactFront;
          }
        }
      }
    }

    // B. Poussée de la porte :
    // Si le PNJ avance sur le battant depuis le côté fermé (v0 > 0 et alpha proche ou supérieur au battant)
    if (alpha > 0 && v0 > 0 && v0 <= door.length + rEff) {
      const angleDiff = alpha - currentAngle;
      // Le PNJ est au contact du battant et pousse vers l'ouverture
      if (angleDiff > -beta && angleDiff < beta + 0.3) {
        const pushAngle = Math.min(minAllowed, Math.max(0, contactBack));
        if (pushAngle > maxPush) {
          maxPush = pushAngle;
        }
      }
    }
  }

  return {
    allowed: Math.max(0, minAllowed),
    push: maxPush,
  };
}

/**
 * Calcule l'angle maximal autorisé pour une porte donnée compte tenu de tous les obstacles actifs.
 */
export function computeDoorAllowedAngle(door: DoorConfig, currentAngle: number = 0): number {
  return computeDoorDynamics(door, currentAngle).allowed;
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
