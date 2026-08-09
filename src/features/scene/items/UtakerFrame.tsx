/**
 * UtakerFrame.tsx — Cadre lit IKEA Utåker (GLB) + matelas et housses procéduraux.
 * id 'utaker-lower' → cadre bas GLB, matelas Vestmarka
 * id 'utaker-upper' → cadre haut GLB, matelas Anneland + surmatelas Nasfjallet
 * Coordonnées locales : centré XZ (longueur sur X), Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF, RoundedBox } from '@react-three/drei';
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

const redFabricMat = new THREE.MeshPhysicalMaterial({
  color: 0x991111,
  roughness: 0.9,
  clearcoat: 0.0,
  sheen: 1.0,
  sheenColor: new THREE.Color(0xff5555),
  sheenRoughness: 0.6,
});

import { Blaskata50569513 } from './Blaskata50569513';

function RealisticBolsters({ topY, zOffset = -26 }: { topY: number; zOffset?: number }) {
  // Blaskata is originally 80cm. Scale 1.25 gives 100cm.
  // We place two of them side by side.
  return (
    <group position={[0, topY + 5, zOffset]}>
      {/* Blaskata is typically along X or Z. Assuming it's along Z, we might need rotation. 
          The Utaker bed is 80x200. We want the bolsters across the width? Or along the length?
          "traversins ... sur le lit" they were at X=-50 and X=50 with rotation Z=PI/2.
          Let's place Blaskata at the same spots. */}
      <group position={[-50, 0, 0]} rotation={[0, 0, 0]} scale={1.25}>
        <Blaskata50569513 item={{ id: 'blaskata' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[50, 0, 0]} rotation={[0, 0, 0]} scale={1.25}>
        <Blaskata50569513 item={{ id: 'blaskata' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}

function RealisticDuvet({ topY, drop }: { topY: number; drop: number }) {
  const len = 150; 
  const wid = 82;
  return (
    <group position={[25, topY + 1, 0]}>
      <RoundedBox args={[len, 2, wid]} radius={0.8} smoothness={4} castShadow receiveShadow material={redFabricMat} />
      <RoundedBox args={[len, drop, 2]} position={[0, -drop/2 + 0.5, wid/2]} radius={0.8} smoothness={4} castShadow receiveShadow material={redFabricMat} />
      <RoundedBox args={[len, drop, 2]} position={[0, -drop/2 + 0.5, -wid/2]} radius={0.8} smoothness={4} castShadow receiveShadow material={redFabricMat} />
      <RoundedBox args={[2, drop, wid - 2]} position={[len/2, -drop/2 + 0.5, 0]} radius={0.8} smoothness={4} castShadow receiveShadow material={redFabricMat} />
      {/* Pliure décorative en haut de la couette */}
      <RoundedBox args={[6, 3.5, wid]} position={[-len/2 + 3, 1, 0]} radius={1.7} smoothness={4} castShadow receiveShadow material={redFabricMat} />
    </group>
  );
}

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
          <RealisticDuvet topY={39} drop={20} />
          <RealisticBolsters topY={39} />
        </>
      ) : (
        <>
          <group position={[0, 11, 0]} rotation-y={Math.PI / 2}>
            <Vestmarka90470195 item={item} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <RealisticDuvet topY={29} drop={14} />
          <RealisticBolsters topY={29} zOffset={26} />
        </>
      )}
    </group>
  );
}

useGLTF.preload(BAS_GLB);
useGLTF.preload(HAUT_GLB);
