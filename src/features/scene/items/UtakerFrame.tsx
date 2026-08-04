/**
 * UtakerFrame.tsx — Cadre lit IKEA Utåker (GLB) + matelas et housses procéduraux.
 * id 'utaker-lower' → cadre bas GLB, matelas Vestmarka
 * id 'utaker-upper' → cadre haut GLB, matelas Anneland + surmatelas Nasfjallet
 * Coordonnées locales : centré XZ (longueur sur X), Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, mergeGlbByMaterial } from '@features/scene/glbUtils';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';

import { Anneland70481722 } from './Anneland70481722';
import { Vestmarka90470195 } from './Vestmarka90470195';
import { Nasfjallet10558045 } from './Nasfjallet10558045';

const BAS_GLB  = 'media/glb/ikea-official/UTÅKER lit empilable 80x200 pin (bas).glb';
const HAUT_GLB = 'media/glb/ikea-official/UTÅKER lit empilable 80x200 pin (haut).glb';

function Cadre({ glbPath }: { glbPath: string }) {
  const { scene } = useGLTFClone(glbPath);
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI / 2;
    mergeGlbByMaterial(scene);
  }, [scene]);
  return <primitive object={scene} />;
}

export function UtakerFrame({ item, onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const isUpper  = item.id === 'utaker-upper';
  const glbPath  = isUpper ? HAUT_GLB : BAS_GLB;

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={groupRef}>
      <Cadre glbPath={glbPath} />
      {isUpper ? (
        <>
          <group position={[0, 11, 0]} rotation-y={Math.PI / 2}>
            <Anneland70481722 item={item} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[0, 11 + 24, 0]} rotation-y={Math.PI / 2}>
            <Nasfjallet10558045 item={item} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </>
      ) : (
        <group position={[0, 11, 0]} rotation-y={Math.PI / 2}>
          <Vestmarka90470195 item={item} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      )}
    </group>
  );
}

useGLTF.preload(BAS_GLB);
useGLTF.preload(HAUT_GLB);
