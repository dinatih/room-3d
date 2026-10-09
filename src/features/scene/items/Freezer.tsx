/** Compact freezer: complete source door, fixed hinges and modelled interior. */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/tillreda_anim/TILLREDA_anim.glb';

export function Freezer({ actionState, onSize, isPreview = false }: SceneItemProps & { isPreview?: boolean }) {
  const { scene, animations } = useGLTFClone(GLB);
  const sceneOpen = useSceneStore(s => s.furniture.freezerOpen);
  const wantOpen = isPreview ? !!actionState['freezer'] : sceneOpen;
  const target = useRef(wantOpen);
  target.current = wantOpen;
  const runtime = useRef<{ mixer: THREE.AnimationMixer; door: THREE.AnimationAction } | null>(null);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    removeGlbLines(scene);
    const clip = animations.find(c => c.name === 'door_open');
    if (!clip) throw new Error('Freezer: missing door_open animation');
    const mixer = new THREE.AnimationMixer(scene);
    const door = mixer.clipAction(clip);
    door.setLoop(THREE.LoopOnce, 1);
    door.clampWhenFinished = true;
    door.play();
    door.paused = true;
    mixer.update(0);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI / 2;
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.skipMerge = true;
    scene.userData.hoverAction = { label: 'Congélateur CHIQ', actions: getObjectActionIds('freezer') };
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    runtime.current = { mixer, door };
    onSize(box.getSize(new THREE.Vector3()));
    invalidate();
    return () => {
      runtime.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [scene, animations, invalidate]);

  useEffect(() => { invalidate(); }, [wantOpen, invalidate]);

  useFrame((_, delta) => {
    const r = runtime.current;
    if (!r) return;
    const end = target.current ? r.door.getClip().duration : 0;
    r.door.time = r.door.time < end ? Math.min(end, r.door.time + delta) : Math.max(end, r.door.time - delta);
    r.mixer.update(0);
    if (r.door.time !== end) invalidate();
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
