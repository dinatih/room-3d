import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../store/useSceneStore';
import { actorRadius } from './agent/agentAvoidance';
import { cameraState } from '../cameraState';
import { architectureObstacles } from './navigation/architecture';
import { furnitureObstacles, getObstacleRevision, navigationDebug, furnitureClearance, getAgentProfile, hasAgentProfile } from './navigation/obstacles';
import { doorKeys, getNavigationGraph } from './navigation/service';
import { doorPolygon, doorCollisionState } from '../doorObstacles';
import { inflate, type Point } from './navigation/geometry';
import { NAVIGATION_COMFORT_COLOR } from './navigation/comfort';
import { NavigationScope } from './navigation/navigationScope';

/** The debug view uses the exact same footprints and routes as the navigation engine. */
export function CollisionDebugHelper() {
  const npc = useSceneStore(s => s.layers.debugNpcCollisions);
  const furniture = useSceneStore(s => s.layers.debugFurnitureCollisions);
  const ref = useRef<THREE.Group>(null!);
  const signature = useRef('');
  const navigation = useRef(new NavigationScope());
  const lastNativeGraph = useRef<ReturnType<typeof getNavigationGraph> | null>(null);
  useEffect(() => {
    const group = ref.current;
    return () => {
      navigation.current.clear();
      for (const child of group.children) {
        const line = child as THREE.Line;
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
    };
  }, []);
  useFrame(() => {
    navigation.current.poll(() => {
    const routes = [...navigationDebug.entries()];
    const nativeProfile = furniture && hasAgentProfile('native') ? getAgentProfile('native') : null;
    const nativeGraph = nativeProfile ? getNavigationGraph(nativeProfile) : null;
    const key = JSON.stringify([npc, furniture, nativeProfile, getObstacleRevision(), routes, doorKeys.map(k => doorCollisionState[k].angle), npc ? cameraState.positions : null]);
    if (signature.current === key && lastNativeGraph.current === nativeGraph) return;
    signature.current = key;
    lastNativeGraph.current = nativeGraph;
    for (const child of [...ref.current.children]) {
      const line = child as THREE.Line;
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      ref.current.remove(line);
    }
    const segments = new Map<string, Map<string, [Point, Point]>>();
    const addLine = (points: Point[], color: string, loop = false) => {
      if (!segments.has(color)) segments.set(color, new Map());
      const edges = segments.get(color)!;
      for (let i = 0; i < points.length - (loop ? 0 : 1); i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        const key = [`${a.x}:${a.z}`, `${b.x}:${b.z}`].sort().join('/');
        edges.set(key, [a, b]);
      }
    };
    if (furniture) {
      if (nativeGraph) for (const cell of nativeGraph.cells) addLine(cell.points, '#00b8d4', true);
      for (const obstacle of [...architectureObstacles, ...furnitureObstacles.values()]) addLine(obstacle.polygon, '#ff9100', true);
      for (const key of doorKeys) addLine(doorPolygon(key, doorCollisionState[key].angle), '#e040fb', true);
      // Keep the reference clearance fixed to Native, independently of active routes.
      if (nativeProfile) for (const obstacle of furnitureObstacles.values()) addLine(inflate(obstacle.polygon, furnitureClearance(nativeProfile)), '#ff3d00', true);
      if (nativeGraph?.comfort) for (const ring of nativeGraph.comfort.obstacles.flat()) addLine(ring, NAVIGATION_COMFORT_COLOR, true);
    }
    if (npc) {
      for (const [id, position] of Object.entries(cameraState.positions)) {
        if (!position || !hasAgentProfile(id)) continue;
        const radius = actorRadius(getAgentProfile(id));
        addLine(inflate([{ x: position.x, z: position.z }], radius), '#00e5ff', true);
      }
    }
    if (furniture || npc) for (const [, route] of routes) {
      if (route.path.length) addLine(route.path, '#00e676');
      if (route.error) addLine(inflate([route.target], 1), '#ff1744', true);
    }
    for (const [color, edges] of segments) {
      const vertices = [...edges.values()].flat().map(p => new THREE.Vector3(p.x, 1, p.z));
      const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
      const material = new THREE.LineBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true, opacity: 0.8 });
      const line = new THREE.LineSegments(geometry, material);
      line.renderOrder = 99990;
      ref.current.add(line);
    }
    });
  });
  return <group ref={ref} />;
}
