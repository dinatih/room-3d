import * as THREE from 'three';

const triangle = new THREE.Triangle();
const closest = new THREE.Vector3();

/** Distance to the actual glass triangles, including separated panes and world transforms. */
export function getAutoMirrorResolution(mirror: THREE.Mesh, cameraPosition: THREE.Vector3): number {
  const positions = mirror.geometry.getAttribute('position');
  const indices = mirror.geometry.index;
  const count = indices ? indices.count : positions.count;
  let distanceSquared = Infinity;
  for (let i = 0; i < count; i += 3) {
    triangle.a.fromBufferAttribute(positions, indices ? indices.getX(i) : i).applyMatrix4(mirror.matrixWorld);
    triangle.b.fromBufferAttribute(positions, indices ? indices.getX(i + 1) : i + 1).applyMatrix4(mirror.matrixWorld);
    triangle.c.fromBufferAttribute(positions, indices ? indices.getX(i + 2) : i + 2).applyMatrix4(mirror.matrixWorld);
    triangle.closestPointToPoint(cameraPosition, closest);
    distanceSquared = Math.min(distanceSquared, closest.distanceToSquared(cameraPosition));
  }
  // Scene units are centimetres; boundaries are deliberately strict.
  return distanceSquared < 50 ** 2 ? 2048 : distanceSquared < 100 ** 2 ? 1024 : 512;
}
