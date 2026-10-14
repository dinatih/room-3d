import type { Point, Polygon } from './geometry';

export interface NavigationObstacleDef {
  id: string;
  polygon: Polygon;
  yMin: number;
  yMax: number;
  owner?: string;
}
export const furnitureObstacles = new Map<string, NavigationObstacleDef>();
let revision = 0;
export const getObstacleRevision = () => revision;
export function registerObstacle(obstacle: NavigationObstacleDef): void {
  if (obstacle.polygon.length < 3 || !obstacle.polygon.every(p => Number.isFinite(p.x) && Number.isFinite(p.z))) throw new Error(`Invalid obstacle ${obstacle.id}`);
  const old = furnitureObstacles.get(obstacle.id);
  if (old && old.owner === obstacle.owner && old.polygon.length === obstacle.polygon.length && old.yMin === obstacle.yMin && old.yMax === obstacle.yMax && old.polygon.every((p, i) => p.x === obstacle.polygon[i]?.x && p.z === obstacle.polygon[i]?.z)) return;
  furnitureObstacles.set(obstacle.id, obstacle);
  revision++;
}
export function unregisterObstacle(id: string): void {
  if (furnitureObstacles.delete(id)) revision++;
}
export interface AgentProfile {
  radius: number;
  height: number;
  /** Full rotating footprint for local avoidance of elongated bodies. */
  bodyRadius?: number;
  /** Robots and animals retain physical separation, including from human agents. */
  solid?: boolean;
}
const profiles = new Map<string, AgentProfile>();
export function setAgentProfile(id: string, profile: AgentProfile): void {
  if (!Number.isFinite(profile.radius) || !Number.isFinite(profile.height) || !(profile.radius > 0) || !(profile.height > 0)) throw new Error(`Invalid navigation profile ${id}`);
  if (profile.bodyRadius !== undefined && (!Number.isFinite(profile.bodyRadius) || profile.bodyRadius < profile.radius)) throw new Error(`Invalid avoidance footprint ${id}`);
  profiles.set(id, profile);
}
export function removeAgentProfile(id: string): void { profiles.delete(id); }
export function getAgentProfile(id: string): AgentProfile {
  const profile = profiles.get(id);
  if (!profile) throw new Error(`Missing navigation profile ${id}`);
  return profile;
}
export function hasAgentProfile(id: string): boolean { return profiles.has(id); }
export const navigationDebug = new Map<string, { path: Point[]; target: Point; error?: string }>();
