import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from './useGLTFClone';
import { cameraState } from './cameraState';
import type { AIRCRAFT_MODELS } from './aircraftModels';

type Definition = typeof AIRCRAFT_MODELS[number];

/** Modèles normalisés à 55 cm ; chaque instance conserve son propre squelette/mixer. */
export function AircraftMesh({ definition, onLaunchReady }: { definition: Definition; onLaunchReady?: () => void }) {
  const { scene, animations } = useGLTFClone(definition.path);
  const ready = useRef(onLaunchReady);
  ready.current = onLaunchReady;
  const started = useRef(false);
  const { mixer, action, scale, offset } = useMemo(() => {
    const mixer = new THREE.AnimationMixer(scene);
    const isOrigami = definition.key === 'origami';
    if (isOrigami && !animations.length) throw new Error('Origami : animation de pliage absente');
    const action = isOrigami ? mixer.clipAction(animations[0]) : null;
    if (action) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      mixer.setTime(action.getClip().duration); // Normaliser la géométrie pliée, prête à voler.
    } else if (definition.key === 'comet') {
      animations.forEach(clip => mixer.clipAction(clip).play());
    }
    // Initialiser aussi les matrices de liaison des SkinnedMesh avant de mesurer.
    // updateWorldMatrix ne déclenche pas leur override updateMatrixWorld.
    scene.updateMatrixWorld(true);
    scene.traverse(object => { if ((object as THREE.SkinnedMesh).isSkinnedMesh) (object as THREE.SkinnedMesh).skeleton.update(); });
    const box = new THREE.Box3().setFromObject(scene, true);
    if (box.isEmpty()) throw new Error(`Modèle d'avion vide : ${definition.key}`);
    const size = box.getSize(new THREE.Vector3());
    const extent = Math.max(size.x, size.y, size.z);
    if (extent <= 0) throw new Error(`Dimensions d'avion invalides : ${definition.key}`);
    const scale = 55 / extent;
    const offset = box.getCenter(new THREE.Vector3()).multiplyScalar(-scale);
    action?.setEffectiveTimeScale(0.1); // Pliage/départ dix fois plus lent.
    if (action && onLaunchReady && !cameraState.planeLaunched) {
      action.reset().play();
      action.paused = true;
      mixer.update(0);
    }
    scene.traverse(object => {
      if ((object as THREE.Mesh).isMesh) { object.castShadow = true; object.receiveShadow = true; }
    });
    return { mixer, action, scale, offset };
  }, [scene, animations, definition]);

  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); }, [mixer, scene]);
  useFrame((_, delta) => {
    if (action && ready.current) {
      if (!cameraState.planeLaunching || cameraState.planeLaunched) return;
      if (!started.current) { started.current = true; action.reset().play(); action.paused = false; }
      mixer.update(delta);
      if (action.time >= action.getClip().duration) ready.current();
    } else if (definition.key === 'comet') mixer.update(delta);
  });

  return <group rotation={[0, definition.yaw, 0]}>
    <group position={offset.toArray()} scale={scale}><primitive object={scene} /></group>
  </group>;
}
