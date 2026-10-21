import { inflate, type Point, type Polygon } from './geometry';

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
}
const profiles = new Map<string, AgentProfile>();
export const agentProfileLifecycle = { onUnused: (_profile: AgentProfile): void => {} };
function releaseUnusedProfile(profile: AgentProfile | undefined): void {
  if (profile && ![...profiles.values()].includes(profile)) agentProfileLifecycle.onUnused(profile);
}
export function setAgentProfile(id: string, profile: AgentProfile): void {
  if (!Number.isFinite(profile.radius) || !Number.isFinite(profile.height) || !(profile.radius > 0) || !(profile.height > 0)) throw new Error(`Invalid navigation profile ${id}`);
  // Equal bodies share graph caches, while removed/replaced bodies must not
  // keep every historical graph alive in a global string-keyed cache.
  const previous = profiles.get(id);
  const shared = [...profiles.values()].find(p => p.radius === profile.radius && p.height === profile.height);
  profiles.set(id, shared ?? { ...profile });
  releaseUnusedProfile(previous);
}
export function removeAgentProfile(id: string): void {
  const previous = profiles.get(id);
  profiles.delete(id);
  releaseUnusedProfile(previous);
}
export function getAgentProfile(id: string): AgentProfile {
  const profile = profiles.get(id);
  if (!profile) throw new Error(`Missing navigation profile ${id}`);
  return profile;
}
export function hasAgentProfile(id: string): boolean { return profiles.has(id); }
export const navigationDebug = new Map<string, { path: Point[]; target: Point; error?: string }>();

/** Requested clearance around furniture: one quarter of the agent body radius. */
export function furnitureClearance(profile: AgentProfile): number { return profile.radius / 4; }

const footprintCaches = new WeakMap<AgentProfile, { revision: number; polygons: WeakMap<NavigationObstacleDef, Polygon> }>();
/** Reuse exact furniture footprints until registered geometry changes. */
export function furnitureFootprint(obstacle: NavigationObstacleDef, profile: AgentProfile): Polygon {
  let cache = footprintCaches.get(profile);
  if (!cache || cache.revision !== revision) {
    cache = { revision, polygons: new WeakMap() };
    footprintCaches.set(profile, cache);
  }
  let polygon = cache.polygons.get(obstacle);
  if (!polygon) {
    polygon = inflate(obstacle.polygon, furnitureClearance(profile));
    cache.polygons.set(obstacle, polygon);
  }
  return polygon;
}
