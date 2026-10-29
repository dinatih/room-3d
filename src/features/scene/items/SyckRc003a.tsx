import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';
import type { SceneItemProps } from '@shared/types';

const GLB = '/items/syck-rc003a/syck-rc003a.glb';

export function SyckRc003a({ actionState = {}, onSize, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene, animations } = useGLTFClone(GLB);
  const wantPot = !!actionState['syck-rc003a-pot'];
  const wantLid = !!actionState['syck-rc003a-lid'] || wantPot;
  const paused = isPreview && !!actionState.previewPaused;
  const { invalidate } = useThree();

  const runtime = useRef<{
    mixer: THREE.AnimationMixer;
    lid: THREE.AnimationAction;
    pot: THREE.AnimationAction;
  } | null>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    const mixer = new THREE.AnimationMixer(scene);
    const getAction = (name: string) => {
      const clip = animations.find(a => a.name === name);
      if (!clip) throw new Error(`SyckRc003a: missing animation ${name}`);
      const act = mixer.clipAction(clip).play();
      act.paused = true;
      return act;
    };
    const lid = getAction('lid_open');
    const pot = getAction('pot_extract');
    mixer.update(0);

    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    scene.userData.hoverAction = {
      label: 'Cuiseur à riz Senya SYCK-RC003/A',
      actions: getObjectActionIds('syck-rc003a'),
    };

    runtime.current = { mixer, lid, pot };
    invalidate();
    onSize?.(box.getSize(new THREE.Vector3()));

    return () => {
      runtime.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [scene, animations, invalidate, onSize]);

  useEffect(() => {
    invalidate();
  }, [wantLid, wantPot, paused, invalidate]);

  useFrame((_, delta) => {
    const r = runtime.current;
    if (!r || paused) return;

    const advance = (time: number, target: number) =>
      time < target ? Math.min(target, time + delta) : Math.max(target, time - delta);

    const lidEnd = wantLid ? r.lid.getClip().duration : 0;
    const potEnd = wantPot ? r.pot.getClip().duration : 0;
    if (r.lid.time === lidEnd && r.pot.time === potEnd) return;

    // Séquence : rétracter le pot avant de fermer le couvercle ; ouvrir le couvercle à fond avant d'extraire le pot
    if (!wantPot && r.pot.time > 0) {
      r.pot.time = advance(r.pot.time, 0);
    } else if (r.lid.time !== lidEnd) {
      r.lid.time = advance(r.lid.time, lidEnd);
    } else if (r.pot.time !== potEnd) {
      r.pot.time = advance(r.pot.time, potEnd);
    }

    r.mixer.update(0);
    if (r.lid.time !== lidEnd || r.pot.time !== potEnd) {
      invalidate();
    }
  });

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
