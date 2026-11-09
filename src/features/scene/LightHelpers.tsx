/** Repères du soleil et du volume réel de ses ombres. */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraHelper, DirectionalLight, DirectionalLightHelper, LineBasicMaterial, MeshBasicMaterial } from 'three';

export function LightHelpers() {
  const scene = useThree(state => state.scene);
  const helpers = useRef<{ light: DirectionalLight; direction: DirectionalLightHelper; camera: CameraHelper } | null>(null);

  useEffect(() => {
    const light = scene.getObjectByName('SunLight');
    if (!(light instanceof DirectionalLight)) throw new Error('SunLight absent des repères de lumière');
    const direction = new DirectionalLightHelper(light, 65, 0xffee44);
    const camera = new CameraHelper(light.shadow.camera);
    for (const helper of [direction, camera]) {
      helper.traverse(object => {
        object.renderOrder = 1000;
        const material = (object as unknown as { material?: LineBasicMaterial | MeshBasicMaterial }).material;
        if (material) {
          material.depthTest = false;
          material.depthWrite = false;
          material.transparent = true;
          material.toneMapped = false;
          material.fog = false;
        }
      });
      scene.add(helper);
    }
    helpers.current = { light, direction, camera };
    return () => {
      helpers.current = null;
      scene.remove(direction, camera);
      direction.dispose();
      camera.dispose();
    };
  }, [scene]);

  useFrame(() => {
    if (!helpers.current) return;
    const { light, direction, camera } = helpers.current;
    light.updateMatrixWorld();
    light.shadow.updateMatrices(light);
    direction.update();
    camera.update();
  });
  return null;
}
