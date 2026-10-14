import * as THREE from 'three';
import { meshWorldBounds } from './animatedFrustumCulling';

type ShadowLight = THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight;

const frustum = new THREE.Frustum();
const projection = new THREE.Matrix4();
const box = new THREE.Box3();
const receiverBox = new THREE.Box3();
const lightBox = new THREE.Box3();
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
  const receivers: THREE.Box3[] = [];
  const lights: ShadowLight[] = [];
  let hasMirror = false;

  scene.traverseVisible(object => {
    const light = object as ShadowLight;
    if (light.isLight && light.castShadow && cameras.some(view => view.layers.test(light.layers))) lights.push(light);
  });
  for (const view of cameras) {
    projection.multiplyMatrices(view.projectionMatrix, view.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projection, view.coordinateSystem, view.reversedDepth);
    scene.traverseVisible(object => {
      const mesh = object as THREE.Mesh & { isReflector?: boolean };
      if (!mesh.isMesh || (!mesh.receiveShadow && !mesh.isReflector) || !mesh.layers.test(view.layers)) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!materials.some(material => material.visible)) return;
      if (mesh.frustumCulled && !frustum.intersectsObject(mesh)) return;
      meshWorldBounds(mesh, box);
      if (mesh.frustumCulled && !frustum.intersectsBox(box)) return;
      if (mesh.isReflector) hasMirror = true;
      if (mesh.receiveShadow) receivers.push(box.clone());
    });
  }

  const unused = lights.filter(light => {
    const shadow = light.shadow;
    if (!shadow) throw new Error(`Shadow-casting light has no shadow: ${light.name}`);
    // PCF shader samplers require a real depth texture even when a light is off
    // or all receivers lie outside its coverage. Let Three.js initialize it once.
    if (shadow.map === null) return false;
    if (light.intensity === 0 || shadow.intensity === 0) return true;
    // Mirrors may show receivers outside the main camera's field of view.
    if (hasMirror) return false;
    if ((light as THREE.PointLight).isPointLight) {
      const point = light as THREE.PointLight;
      const far = point.distance || shadow.camera.far;
      if (shadow.camera.far !== far) {
        shadow.camera.far = far;
        shadow.camera.updateProjectionMatrix();
      }
      lightPosition.setFromMatrixPosition(light.matrixWorld);
      shadow.matrix.makeTranslation(-lightPosition.x, -lightPosition.y, -lightPosition.z);
      // Point-shadow shaders test max(abs(x), abs(y), abs(z)), matching the cube
      // faces' depth, rather than radial distance from the light.
      lightBox.min.copy(lightPosition).addScalar(-far);
      lightBox.max.copy(lightPosition).addScalar(far);
      return !receivers.some(bounds => receiverBox.copy(bounds).expandByScalar(shadow.normalBias).intersectsBox(lightBox));
    }
    shadow.updateMatrices(light);
    return !receivers.some(bounds => overlapsShadowFrame(shadow, receiverBox.copy(bounds).expandByScalar(shadow.normalBias)));
  });
  return { shadows: unused.map(light => light.shadow), allUnused: unused.length === lights.length };
}
