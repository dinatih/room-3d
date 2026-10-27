/**
 * ChestBench.tsx — Coffre banc YITAHOME 100 Gal articulé (122×55×66cm).
 * Modèle GLB officiel avec animation d'ouverture du couvercle 'lid_open'.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/chest-bench/chest-bench-animated.glb';
const LID_DURATION = 0.8;

export function ChestBench({ actionState, onSize }: SceneItemProps) {
  const { scene, animations } = useGLTFClone(GLB, true);
  const isOpen = !!actionState['chest-bench-open'];
  const { invalidate } = useThree();
  const runtime = useRef<{ mixer: THREE.AnimationMixer; action: THREE.AnimationAction } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    const mixer = new THREE.AnimationMixer(scene);
    const clip = animations.find(a => a.name === 'lid_open');
    if (!clip) throw new Error('ChestBench: missing lid_open animation');
    const action = mixer.clipAction(clip).play();
    action.paused = true;
    mixer.update(0);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    scene.userData.hoverAction = { label: 'Banc coffre jardin', actions: getObjectActionIds('chest-bench') };
    const lid = scene.getObjectByName('ChestBenchLid');
    if (lid) lid.userData = { birdPerch: !isOpen };
    runtime.current = { mixer, action };
    onSize(box.getSize(new THREE.Vector3()));
  }, []);

  useFrame((_, dt) => {
    const rt = runtime.current;
    if (!rt) return;
    const targetTime = isOpen ? LID_DURATION : 0;
    if (rt.action.time === targetTime) return;
    const step = dt / LID_DURATION;
    rt.action.time = THREE.MathUtils.clamp(
      rt.action.time + (isOpen ? step : -step) * LID_DURATION,
      0,
      LID_DURATION,
    );
    rt.mixer.update(0);
    const lid = scene.getObjectByName('ChestBenchLid');
    if (lid) lid.userData.birdPerch = !isOpen;
    invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
