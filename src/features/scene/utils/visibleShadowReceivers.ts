import * as THREE from 'three';
import { meshWorldBounds } from './animatedFrustumCulling';

type ShadowLight = THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight;

const frustum = new THREE.Frustum();
const projection = new THREE.Matrix4();
const box = new THREE.Box3();
const receiverBox = new THREE.Box3();
const lightPosition = new THREE.Vector3();
const corner = new THREE.Vector3();

function overlapsShadowFrame(shadow: THREE.LightShadow, bounds: THREE.Box3) {
  // The four side planes match the shader's shadow-UV test. Keeping depth
  // conservative also preserves receivers displaced by the configured depth bias.
  const [right, left, bottom, top] = shadow.getFrustum().planes;
  for (const plane of [right, left, bottom, top]) {
    corner.set(
      plane.normal.x > 0 ? bounds.max.x : bounds.min.x,
      plane.normal.y > 0 ? bounds.max.y : bounds.min.y,
      plane.normal.z > 0 ? bounds.max.z : bounds.min.z,
    );
    if (plane.distanceToPoint(corner) < 0) return false;
  }
  return true;
}

/** Call after renderer world-matrix updates, before its shadow pass. */
export function getUnusedShadows(scene: THREE.Scene, camera: THREE.Camera) {
  const cameras = (camera as THREE.ArrayCamera).isArrayCamera ? (camera as THREE.ArrayCamera).cameras : [camera];
  const lights: ShadowLight[] = [];
  const mirrors: (THREE.Mesh & { isReflector?: boolean })[] = [];
  let hasMirror = false;

  scene.traverseVisible(object => {
    const light = object as ShadowLight;
    if (light.isLight && light.castShadow && cameras.some(view => view.layers.test(light.layers))) lights.push(light);
    const mirror = object as THREE.Mesh & { isReflector?: boolean };
    if (mirror.isReflector) mirrors.push(mirror);
  });
  // A visible mirror can show receivers outside the main camera. Detect it
  // before collecting receiver bounds: those bounds cannot reject any active
  // light in this case, and skinning their vertices would be wasted work.
  for (const view of cameras) {
    if (hasMirror) break;
    projection.multiplyMatrices(view.projectionMatrix, view.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projection, view.coordinateSystem, view.reversedDepth);
    for (const mirror of mirrors) {
      if (!mirror.layers.test(view.layers)) continue;
      const materials = Array.isArray(mirror.material) ? mirror.material : [mirror.material];
      if (!materials.some(material => material.visible)) continue;
      if (mirror.frustumCulled && !frustum.intersectsObject(mirror)) continue;
      meshWorldBounds(mirror, box);
      if (!mirror.frustumCulled || frustum.intersectsBox(box)) { hasMirror = true; break; }
    }
  }
  const unused = new Set<ShadowLight>();
  const pending = new Map<ShadowLight, THREE.Box3 | null>();
  for (const light of lights) {
    const shadow = light.shadow;
    if (!shadow) throw new Error(`Shadow-casting light has no shadow: ${light.name}`);
    // PCF samplers still need their first depth texture, even for an off light.
    if (shadow.map === null) continue;
    if (light.intensity === 0 || shadow.intensity === 0) { unused.add(light); continue; }
    if (hasMirror) continue;
    if ((light as THREE.PointLight).isPointLight) {
      const far = (light as THREE.PointLight).distance || shadow.camera.far;
      if (shadow.camera.far !== far) {
        shadow.camera.far = far;
        shadow.camera.updateProjectionMatrix();
      }
      lightPosition.setFromMatrixPosition(light.matrixWorld);
      shadow.matrix.makeTranslation(-lightPosition.x, -lightPosition.y, -lightPosition.z);
      // Match the cube-face depth test used by point-shadow shaders.
      const coverage = new THREE.Box3();
      coverage.min.copy(lightPosition).addScalar(-far);
      coverage.max.copy(lightPosition).addScalar(far);
      pending.set(light, coverage);
    } else {
      shadow.updateMatrices(light);
      pending.set(light, null);
    }
  }
  for (const view of cameras) {
    if (!pending.size) break;
    projection.multiplyMatrices(view.projectionMatrix, view.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projection, view.coordinateSystem, view.reversedDepth);
    scene.traverseVisible(object => {
      // A receiver proves that an entire shadow pass is needed. Once every
      // active light has one, later mesh bounds cannot change that decision.
      if (!pending.size) return;
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.receiveShadow || !mesh.layers.test(view.layers)) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!materials.some(material => material.visible)) return;
      if (mesh.frustumCulled && !frustum.intersectsObject(mesh)) return;
      meshWorldBounds(mesh, box);
      if (mesh.frustumCulled && !frustum.intersectsBox(box)) return;
      for (const [light, coverage] of pending) {
        receiverBox.copy(box).expandByScalar(light.shadow.normalBias);
        if (coverage ? receiverBox.intersectsBox(coverage) : overlapsShadowFrame(light.shadow, receiverBox)) pending.delete(light);
      }
    });
  }
  for (const light of pending.keys()) unused.add(light);
  return { shadows: lights.filter(light => unused.has(light)).map(light => light.shadow), allUnused: unused.size === lights.length };
}
