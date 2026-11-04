import * as THREE from 'three';

/** Snapshot visible uniquement, avec les UUID des os et des cibles de lumière conservés. */
export function serializeRenderScene(scene: THREE.Scene) {
  const snapshot = scene.clone(false);
  snapshot.background = scene.background instanceof THREE.Texture ? scene.environment : scene.background;
  const copyVisible = (source: THREE.Object3D, parent: THREE.Object3D) => {
    if (!source.visible) return;
    const copy = source.clone(false);
    copy.uuid = source.uuid;
    if (source instanceof THREE.DirectionalLight || source instanceof THREE.SpotLight) {
      (copy as THREE.DirectionalLight | THREE.SpotLight).target = source.target;
    }
    parent.add(copy);
    source.children.forEach(child => copyVisible(child, copy));
  };
  scene.children.forEach(child => copyVisible(child, snapshot));
  return snapshot.toJSON();
}
