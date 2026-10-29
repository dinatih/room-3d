import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Poignées identiques des portes intérieures et de la face intérieure de l’entrée. */
export function createDoorHandleGeometry(thickness: number, direction: number, sides: readonly number[] = [-1, 1]) {
  const radius = 1.3;
  const geometries: THREE.BufferGeometry[] = [];
  for (const side of sides) {
    const z = side * (thickness / 2 + 6);
    geometries.push(
      new THREE.CylinderGeometry(3, 3, 1, 12).rotateX(Math.PI / 2).translate(0, 0, side * (thickness / 2 + 0.5)),
      new THREE.CylinderGeometry(radius, radius, 5, 8).rotateX(Math.PI / 2).translate(0, 0, side * (thickness / 2 + 3.5)),
      new THREE.CylinderGeometry(radius, radius, 14, 8).rotateZ(Math.PI / 2).translate(direction * 7, 0, z),
      new THREE.SphereGeometry(radius, 8, 6).translate(0, 0, z),
      new THREE.SphereGeometry(radius, 8, 6).translate(direction * 14, 0, z),
    );
  }
  const geometry = mergeGeometries(geometries, false);
  geometries.forEach(part => part.dispose());
  return geometry;
}
