import { useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, LoopOnce, LoopRepeat, Vector3 } from 'three';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { isAppIdle } from '../idleState';
import { useRigidMeshBatches } from '../utils/useRigidMeshBatches';

export function Microduck({ actionState = {}, onSize }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene, animations } = useGLTFClone('models/microduck.glb');
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const motion = actionState['microduck-motion'] ?? 'idle';
  const replay = actionState['microduck-replay'];

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    // The export uses metres and faces +X; the scene uses centimetres and +Z.
    scene.rotation.y = -Math.PI / 2;
    scene.scale.setScalar(100);
    scene.traverse(node => { if ('isMesh' in node && node.isMesh) node.castShadow = node.receiveShadow = true; });
    onSize?.(glbLocalBBox(scene).getSize(new Vector3()));
  }, [scene, onSize]);

  useLayoutEffect(() => {
    const clip = animations.find(animation => animation.name === motion);
    if (!clip) throw new Error(`Microduck : animation inconnue : ${motion}`);
    // Restore untracked joints when leaving quack or walk.
    mixer.stopAllAction();
    const looping = motion === 'idle' || motion === 'walk';
    const action = mixer.clipAction(clip).reset().setLoop(looping ? LoopRepeat : LoopOnce, looping ? Infinity : 1);
    action.clampWhenFinished = true;
    action.play();
    mixer.update(0);
    return () => { action.stop(); };
  }, [animations, mixer, motion, replay]);
  useLayoutEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); }, [mixer, scene]);
  useFrame((state, delta) => {
    if (isAppIdle()) return;
    mixer.update(delta);
    state.invalidate();
  });
  const batches = useRigidMeshBatches(scene);
  return <group><primitive object={scene} /><primitive object={batches} /></group>;
}
