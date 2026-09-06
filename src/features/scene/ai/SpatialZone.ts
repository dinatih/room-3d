import { SmartObjectDef, Waypoint, SpatialZoneDef, InteractionType } from './aiTypes';
import { WAYPOINTS } from './ZoneNodes';
import { SMART_OBJECTS, getSmartObject } from './smartObjectRegistry';
import { OccupancyManager } from './occupancyManager';

/**
 * Boîte englobante 3D [minX, minY, minZ, maxX, maxY, maxZ] (en cm)
 */
export type BoundingBox3D = {
  min: [number, number, number];
  max: [number, number, number];
};

/**
 * Vérifie si un point [x, y, z] est contenu dans la BoundingBox3D.
 */
export function isPointInBounds(pos: [number, number, number] | { x: number; y?: number; z: number }, bounds: BoundingBox3D): boolean {
  const x = Array.isArray(pos) ? pos[0] : pos.x;
  const y = Array.isArray(pos) ? pos[1] : (pos.y ?? 0);
  const z = Array.isArray(pos) ? pos[2] : pos.z;

  return (
    x >= bounds.min[0] && x <= bounds.max[0] &&
    y >= bounds.min[1] && y <= bounds.max[1] &&
    z >= bounds.min[2] && z <= bounds.max[2]
  );
}

/**
 * Classe représentant un volume 3D spatial (Pièce, Jardin, Terrasse, etc.)
 */
export class SpatialZone {
  public id: string;
  public name: string;
  public environment: 'indoor' | 'outdoor';
  public bounds: BoundingBox3D;

  private smartObjects: Map<string, SmartObjectDef> = new Map();
  private waypoints: Map<string, Waypoint> = new Map();

  constructor(def: SpatialZoneDef) {
    this.id = def.id;
    this.name = def.name;
    this.environment = def.environment;
    this.bounds = def.bounds;
  }

  /**
   * Vérifie si une position donnée est contenue dans cette zone.
   */
  public contains(position: [number, number, number] | { x: number; y?: number; z: number }): boolean {
    return isPointInBounds(position, this.bounds);
  }

  public registerSmartObject(obj: SmartObjectDef): void {
    this.smartObjects.set(obj.id, obj);
  }

  public unregisterSmartObject(objectId: string): void {
    this.smartObjects.delete(objectId);
  }

  public getSmartObjects(): SmartObjectDef[] {
    return Array.from(this.smartObjects.values());
  }

  public registerWaypoint(wp: Waypoint): void {
    this.waypoints.set(wp.id, wp);
  }

  public unregisterWaypoint(waypointId: string): void {
    this.waypoints.delete(waypointId);
  }

  public getWaypoints(): Waypoint[] {
    return Array.from(this.waypoints.values());
  }

  /**
   * Recherche un SmartObject disponible selon un type d'interaction ou une catégorie,
   * le plus proche de la position de l'agent si applicable.
   */
  public findAvailableObject(
    interactionTypeOrCategory: InteractionType | string,
    agentPosition?: [number, number, number] | { x: number; y?: number; z: number },
    characterId?: string
  ): { smartObject: SmartObjectDef; slotId: string; approachWaypoint: Waypoint } | null {
    const candidates: Array<{
      smartObject: SmartObjectDef;
      slotId: string;
      approachWaypoint: Waypoint;
      distance: number;
    }> = [];

    const agentX = agentPosition ? (Array.isArray(agentPosition) ? agentPosition[0] : agentPosition.x) : 0;
    const agentZ = agentPosition ? (Array.isArray(agentPosition) ? agentPosition[2] : agentPosition.z) : 0;

    for (const rawObj of this.smartObjects.values()) {
      const obj = getSmartObject(rawObj.id) || rawObj;
      // Filtrage par catégorie ou par slots d'interaction
      const matchesCategory = obj.category === interactionTypeOrCategory;
      const matchingSlots = obj.slots.filter(slot => {
        if (matchesCategory) return true;
        if (slot.slotId.includes(interactionTypeOrCategory)) return true;
        if (slot.name.toLowerCase().includes(interactionTypeOrCategory.toLowerCase())) return true;
        return false;
      });

      if (matchingSlots.length === 0) continue;

      for (const slot of matchingSlots) {
        const isOccupied = characterId
          ? OccupancyManager.isSlotOccupied(obj.id, slot.slotId, characterId)
          : false;

        if (!isOccupied) {
          const targetCoords = slot.approachOffset ?? slot.offset ?? obj.position;
          const dist = Math.hypot(targetCoords[0] - agentX, targetCoords[2] - agentZ);
          
          const approachWaypoint: Waypoint = {
            id: `approach-${obj.id}-${slot.slotId}`,
            name: `Approche ${obj.name} (${slot.name})`,
            x: targetCoords[0],
            y: targetCoords[1],
            z: targetCoords[2],
            rotationY: slot.rotY
          };

          candidates.push({
            smartObject: obj,
            slotId: slot.slotId,
            approachWaypoint,
            distance: dist
          });
        }
      }
    }

    if (candidates.length === 0) return null;

    // Trier par distance la plus proche de l'agent
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0];
  }
}

/**
 * Définition des volumes 3D des pièces de l'appartement et de l'environnement,
 * directement indexés et délimités par les piliers architecturaux (PILLAR_DEFS).
 */
export const SPATIAL_ZONES_CONFIG: SpatialZoneDef[] = [
  {
    id: 'living',
    name: 'Séjour / Salon',
    environment: 'indoor',
    // Délimité par : corner-nw, corner-ne, corner-se, corner-sw, niche-beam, kitchen-* (Z=460), door-living-*
    bounds: {
      min: [-15, 0, -10],
      max: [330, 250, 460]
    }
  },
  {
    id: 'bathroom',
    name: 'Salle de bain',
    environment: 'indoor',
    // Délimité par : bath-nw, bath-ne, bath-se, shower-*, door-bath-*, diag-sw
    bounds: {
      min: [-15, 0, 460],
      max: [195.6, 250, 685]
    }
  },
  {
    id: 'corridor',
    name: 'Couloir Entrée',
    environment: 'indoor',
    // Délimité par : placard couloir (kitchen-ne, kitchen-se), corner-se, door-living-*, door-bath-*, diag-ne, door-entry-w
    bounds: {
      min: [130, 0, 400],
      max: [330, 250, 685]
    }
  },
  {
    id: 'garden',
    name: 'Jardin & Terrasse Nord',
    environment: 'outdoor',
    // Délimité par : corner-nw-ext, corner-ne-ext, garden-e
    bounds: {
      min: [-100, 0, -800],
      max: [450, 500, 0]
    }
  },
  {
    id: 'outdoor_corridor',
    name: 'Extérieur Couloir / Sortie Sud-Ouest',
    environment: 'outdoor',
    // Délimité par : le couloir PVC rouge longeant la diagonale jusqu'à diag-ne (X=330)
    bounds: {
      min: [-500, 0, 450],
      max: [330, 500, 1200]
    }
  },
  {
    id: 'outdoor_garden',
    name: 'Cour Bâtiment B / Jardin Ouest',
    environment: 'outdoor',
    bounds: {
      min: [-600, 0, -800],
      max: [-100, 500, 100]
    }
  }
];

/**
 * Gestionnaire global des zones spatiales (ZoneManager / SpatialZoneManager)
 */
class SpatialZoneManagerClass {
  private zones: Map<string, SpatialZone> = new Map();

  constructor() {
    this.init();
  }

  public init(): void {
    this.zones.clear();
    for (const conf of SPATIAL_ZONES_CONFIG) {
      this.zones.set(conf.id, new SpatialZone(conf));
    }
    this.indexSmartObjectsAndWaypoints();
  }

  public indexSmartObjectsAndWaypoints(): void {
    // Indexation des Waypoints
    for (const wp of Object.values(WAYPOINTS)) {
      const pos: [number, number, number] = [wp.x, wp.y ?? 0, wp.z];
      for (const zone of this.zones.values()) {
        if (zone.contains(pos)) {
          zone.registerWaypoint(wp);
        }
      }
    }

    // Indexation des SmartObjects
    for (const obj of Object.values(SMART_OBJECTS)) {
      for (const zone of this.zones.values()) {
        if (zone.contains(obj.position)) {
          zone.registerSmartObject(obj);
        }
      }
    }
  }

  public getZone(id: string): SpatialZone | undefined {
    return this.zones.get(id);
  }

  public getAllZones(): SpatialZone[] {
    return Array.from(this.zones.values());
  }

  /**
   * Identifie dans quelle Zone se trouve une position donnée.
   */
  public getZoneAt(position: [number, number, number] | { x: number; y?: number; z: number }): SpatialZone | undefined {
    for (const zone of this.zones.values()) {
      if (zone.contains(position)) {
        return zone;
      }
    }
    return undefined;
  }
}

export const SpatialZoneManager = new SpatialZoneManagerClass();
export const ZoneManager = SpatialZoneManager;
