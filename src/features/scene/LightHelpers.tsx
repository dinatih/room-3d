/** Repères du soleil (jaune), de la lune (bleu) et de leurs ombres actives. */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraHelper, DirectionalLight, DirectionalLightHelper, LineBasicMaterial, MeshBasicMaterial } from 'three';

export function LightHelpers() {
  const scene = useThree(state => state.scene);
  const helpers = useRef<{ light: DirectionalLight; direction: DirectionalLightHelper; camera: CameraHelper }[]>([]);

  useEffect(() => {
    helpers.current = ([['SunLight', 0xffee44], ['MoonLight', 0x99bbff]] as const).map(([name, color]) => {
      const light = scene.getObjectByName(name);
      if (!(light instanceof DirectionalLight)) throw new Error(`${name} absent des repères de lumière`);
      const direction = new DirectionalLightHelper(light, 65, color);
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
      return { light, direction, camera };
    });
    return () => {
      for (const { direction, camera } of helpers.current) {
        scene.remove(direction, camera);
        direction.dispose();
        camera.dispose();
      }
      helpers.current = [];
    };
  }, [scene]);

  useFrame(() => {
    for (const { light, direction, camera } of helpers.current) {
      light.updateMatrixWorld();
      light.shadow.updateMatrices(light);
      direction.update();
      camera.update();
      camera.visible = light.intensity > 0;
    }
  });
  return null;
}
