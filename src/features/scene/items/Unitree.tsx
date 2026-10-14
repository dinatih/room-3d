import { useLayoutEffect } from 'react';
import { Vector3 } from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import type { SceneItemProps } from '@shared/types';

function UnitreeModel({ model, onSize }: SceneItemProps & { model: 'g1' | 'go2' }) {
  const { scene } = useGLTFClone(`items/unitree-${model}/unitree-${model}.glb`);
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.traverse(node => {
      if ('isMesh' in node && node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    onSize(glbLocalBBox(scene).getSize(new Vector3()));
  }, [scene, onSize]);
  return <primitive object={scene} />;
}

export function UnitreeG1(props: SceneItemProps) {
  return <UnitreeModel {...props} model="g1" />;
}

export function UnitreeGo2(props: SceneItemProps) {
  return <UnitreeModel {...props} model="go2" />;
}
