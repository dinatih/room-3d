/**
 * TrashBin.tsx — TATAY Smart Deco 25L (26×36×47 cm).
 * Modèle officiel Amazon AR avec animation coordonnée du couvercle et de la pédale.
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
const ANIM_DURATION = 0.8;

export function TrashBin({ actionState, onSize }: SceneItemProps) {
  const { scene, animations } = useGLTFClone(GLB, true);
  const isOpen = !!actionState?.['bin-toggle'];
  const { invalidate } = useThree();
  const runtime = useRef<{ mixer: THREE.AnimationMixer; actions: THREE.AnimationAction[] } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const mixer = new THREE.AnimationMixer(scene);
    const actions = animations.map(clip => {
      const act = mixer.clipAction(clip).play();
      act.paused = true;
      return act;
    });
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
    runtime.current = { mixer, actions };
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, animations, onSize]);

  useFrame((_, dt) => {
    const rt = runtime.current;
    if (!rt) return;
    const target = isOpen ? ANIM_DURATION : 0;
    const first = rt.actions[0];
    if (!first || first.time === target) return;
    const step = dt / ANIM_DURATION;
    const newTime = THREE.MathUtils.clamp(first.time + (isOpen ? step : -step) * ANIM_DURATION, 0, ANIM_DURATION);
    for (const act of rt.actions) {
      act.time = newTime;
    }
    rt.mixer.update(0);
    invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
