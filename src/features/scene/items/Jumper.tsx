import { useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, LoopOnce, LoopRepeat, Vector3, type Mesh, type MeshStandardMaterial } from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import type { SceneItemProps } from '@shared/types';
import { isAppIdle } from '../idleState';
import { useRigidMeshBatches } from '../utils/useRigidMeshBatches';

/** Rigid articulated robot: each GLB link rotates about its original URDF pivot. */
export function Jumper({ actionState = {}, onSize }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene, animations } = useGLTFClone('items/jumper/jumper.glb', true);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const motion = actionState['jumper-motion'] ?? 'idle';
  const replay = actionState['jumper-replay'];

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.traverse(node => {
      if ('isMesh' in node && node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        const material = (node as Mesh).material;
        for (const mat of Array.isArray(material) ? material : [material]) {
          const surface = mat as MeshStandardMaterial;
          if (surface.isMeshStandardMaterial && surface.color.r > surface.color.g && surface.color.r > surface.color.b) {
            // Same linear RGB and finish as the red panels exported for Unitree Go2.
            surface.color.setRGB(0.65, 0.012, 0.02);
            surface.roughness = 0.5;
          }
        }
      }
    });
    onSize?.(glbLocalBBox(scene).getSize(new Vector3()));
  }, [scene, onSize]);

  useLayoutEffect(() => {
    const clip = animations.find(animation => animation.name === motion);
    if (!clip) throw new Error(`Jumper: animation inconnue : ${motion}`);
    const looping = ['idle', 'walk', 'turn-left', 'turn-right', 'maze'].includes(motion);
    const action = mixer.clipAction(clip);
    action.reset().setLoop(looping ? LoopRepeat : LoopOnce, looping ? Infinity : 1);
    action.clampWhenFinished = true;
    action.play();
    mixer.update(0);
    return () => { action.stop(); };
  }, [animations, mixer, motion, replay]);

  useLayoutEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); }, [mixer, scene]);
  useFrame((state, delta) => {
    if (isAppIdle()) return;
    mixer.update(delta);
    if (motion !== 'idle') state.invalidate();
  });
  const batches = useRigidMeshBatches(scene);
  return <group><primitive object={scene} /><primitive object={batches} /></group>;
}
