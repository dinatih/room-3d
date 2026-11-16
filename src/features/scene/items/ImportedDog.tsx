import { useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, Vector3 } from 'three';
import { glbLocalBBox } from '../glbUtils';
import { useGLTFClone } from '../useGLTFClone';
import type { SceneModelProps } from '@shared/types';

/** Original skeleton and clips; one animation at a time, independent per dog. */
export function ImportedDog({ path, height, clip, onSize }: SceneModelProps & { path: string; height: number; clip: string }) {
  const { scene, animations } = useGLTFClone(path);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  useLayoutEffect(() => {
    const animation = animations.find(animation => animation.name === clip);
    if (!animation) throw new Error(`Missing dog animation ${clip}: ${path}`);
    mixer.stopAllAction();
    mixer.clipAction(animation).reset().play();
    mixer.update(0);
    scene.scale.setScalar(1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const bounds = glbLocalBBox(scene, true);
    const size = bounds.getSize(new Vector3());
    if (size.y <= 0) throw new Error(`Invalid dog bounds: ${path}`);
    const scale = height / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-(bounds.min.x + bounds.max.x) / 2 * scale, -bounds.min.y * scale, -(bounds.min.z + bounds.max.z) / 2 * scale);
    onSize?.(size.multiplyScalar(scale));
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); };
  }, [scene, height, path, onSize, animations, clip, mixer]);
  useFrame((_, delta) => mixer.update(delta));
  return <primitive object={scene} />;
}
