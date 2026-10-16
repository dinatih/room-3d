import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../store/useSceneStore';
import { cameraState } from '../cameraState';
import { architectureObstacles } from './navigation/architecture';
import { furnitureObstacles, getObstacleRevision, navigationDebug, getAgentProfile, hasAgentProfile } from './navigation/obstacles';
import { doorKeys, doorPolygon } from './navigation/service';
import { doorCollisionState } from '../doorObstacles';
import { inflate, type Point } from './navigation/geometry';

/** The debug view uses the exact same footprints and routes as the navigation engine. */
export function CollisionDebugHelper() {
  const npc = useSceneStore(s => s.layers.debugNpcCollisions);
  const furniture = useSceneStore(s => s.layers.debugFurnitureCollisions);
  const ref = useRef<THREE.Group>(null!);
  const signature = useRef('');
  useEffect(() => {
    const group = ref.current;
    return () => {
      for (const child of group.children) {
        const line = child as THREE.Line;
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
    };
  }, []);
  useFrame(() => {
    const routes = [...navigationDebug.entries()];
    const nativeRadius = furniture && hasAgentProfile('native') ? getAgentProfile('native').radius : null;
    const key = JSON.stringify([npc, furniture, nativeRadius, getObstacleRevision(), routes, doorKeys.map(k => doorCollisionState[k].angle), npc ? cameraState.positions : null]);
    if (signature.current === key) return;
    signature.current = key;
    for (const child of [...ref.current.children]) {
      const line = child as THREE.Line;
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      ref.current.remove(line);
    }
    const addLine = (points: Point[], color: string, loop = false) => {
      const vertices = (loop ? [...points, points[0]] : points).map(p => new THREE.Vector3(p.x, 1, p.z));
      const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
      const material = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.8 });
      const line = new THREE.Line(geometry, material);
      line.renderOrder = 99990;
      ref.current.add(line);
    };
    if (furniture) {
      for (const obstacle of [...architectureObstacles, ...furnitureObstacles.values()]) addLine(obstacle.polygon, '#ff9100', true);
      for (const key of doorKeys) addLine(doorPolygon(key, doorCollisionState[key].angle), '#e040fb', true);
      // Keep the reference clearance fixed to Native, independently of active routes.
      if (nativeRadius !== null) for (const obstacle of furnitureObstacles.values()) addLine(inflate(obstacle.polygon, nativeRadius), '#ff3d00', true);
    }
    if (npc) {
      for (const [id, position] of Object.entries(cameraState.positions)) {
        if (!position || !hasAgentProfile(id)) continue;
        const radius = getAgentProfile(id).radius;
        addLine(inflate([{ x: position.x, z: position.z }], radius), '#00e5ff', true);
      }
    }
    if (furniture || npc) for (const [, route] of routes) {
      if (route.path.length) addLine(route.path, '#00e676');
      if (route.error) addLine(inflate([route.target], 1), '#ff1744', true);
    }
  });
  return <group ref={ref} />;
}
