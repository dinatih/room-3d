/** Photo-referenced TecTake Sintra GLB, with independently reversible arm clips. */
import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { glbLocalBBox } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';
import { useDoorOpen } from './useDoorOpen';

const PATH = '/items/armrest-sofa-gris/TectakeSintra.glb';
const ARMS = [
  { node: 'ArmLeft', clip: 'left_flatten', id: 'sofa-arm-left', label: 'Accoudoir Gauche' },
  { node: 'ArmRight', clip: 'right_flatten', id: 'sofa-arm-right', label: 'Accoudoir Droit' },
] as const;
preloadSceneGLTF(PATH);

export function ArmrestSofa({ actionState = {}, onSize, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene, animations } = useGLTFClone(PATH);
  const leftFlat = useDoorOpen('sofa-arm-left', isPreview, actionState);
  const rightFlat = useDoorOpen('sofa-arm-right', isPreview, actionState);
  const { invalidate } = useThree();
  const runtime = useRef<{ mixer: THREE.AnimationMixer; actions: THREE.AnimationAction[] } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.traverse(child => {
      if ((child as THREE.Mesh).isMesh) child.castShadow = child.receiveShadow = true;
    });
    const mixer = new THREE.AnimationMixer(scene);
    const actions = ARMS.map(arm => {
      const clip = animations.find(a => a.name === arm.clip);
      const node = scene.getObjectByName(arm.node);
      if (!clip || !node) throw new Error(`Sintra: missing ${arm.node} / ${arm.clip}`);
      node.userData.hoverAction = { label: arm.label, actionId: arm.id };
      node.traverse(child => { if ((child as THREE.Mesh).isMesh) child.userData.birdPerch = true; });
      const action = mixer.clipAction(clip).play();
      action.paused = true;
      return action;
    });
    mixer.update(0);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.skipMerge = scene.userData.sceneItemRoot = true;
    runtime.current = { mixer, actions };
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); runtime.current = null; };
  }, [scene, animations]);

  useLayoutEffect(() => {
    const rt = runtime.current!;
    const times = rt.actions.map(a => a.time);
    for (const [i, flat] of [leftFlat, rightFlat].entries()) {
      rt.actions[i].time = flat ? rt.actions[i].getClip().duration : 0;
    }
    rt.mixer.update(0);
    onSize?.(glbLocalBBox(scene).getSize(new THREE.Vector3()));
    rt.actions.forEach((a, i) => { a.time = times[i]; });
    rt.mixer.update(0);
    invalidate();
  }, [scene, animations, leftFlat, rightFlat, onSize, invalidate]);

  useFrame((_, dt) => {
    const rt = runtime.current;
    if (!rt || (isPreview && actionState.previewPaused)) return;
    let changed = false;
    for (const [i, flat] of [leftFlat, rightFlat].entries()) {
      const action = rt.actions[i];
      const duration = action.getClip().duration;
      const target = flat ? duration : 0;
      if (action.time === target) continue;
      action.time = THREE.MathUtils.clamp(action.time + (flat ? dt : -dt), 0, duration);
      changed = true;
    }
    if (changed) { rt.mixer.update(0); invalidate(); }
  });

  return <primitive object={scene} />;
}
