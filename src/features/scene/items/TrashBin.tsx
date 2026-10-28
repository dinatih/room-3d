/**
 * TrashBin.tsx — TATAY Smart Deco 25L (26×36×47 cm).
 * Modèle officiel Amazon AR découpé avec animation d'ouverture du couvercle.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/trash-bin/tatay-smart-deco.glb';
const ANIM_DURATION = 1.0;

export function TrashBin({ actionState, onSize }: SceneItemProps) {
  const { scene, animations } = useGLTFClone(GLB, true);
  const isOpen = !!actionState?.['bin-toggle'];
  const { invalidate } = useThree();
  const runtime = useRef<{ mixer: THREE.AnimationMixer; action: THREE.AnimationAction } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const mixer = new THREE.AnimationMixer(scene);
    const clip = animations.find(a => a.name === 'bin_open');
    if (!clip) throw new Error('TrashBin: missing bin_open animation');
    const action = mixer.clipAction(clip).play();
    action.paused = true;
    mixer.update(0);

    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    scene.userData.hoverAction = {
      label: 'Poubelle TATAY 25L',
      actions: getObjectActionIds('trash-bin'),
    };
    runtime.current = { mixer, action };
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, animations, onSize]);

  useFrame((_, dt) => {
    const rt = runtime.current;
    if (!rt) return;
    const target = isOpen ? ANIM_DURATION : 0;
    if (rt.action.time === target) return;
    const step = dt / ANIM_DURATION;
    rt.action.time = THREE.MathUtils.clamp(rt.action.time + (isOpen ? step : -step) * ANIM_DURATION, 0, ANIM_DURATION);
    rt.mixer.update(0);
    invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
