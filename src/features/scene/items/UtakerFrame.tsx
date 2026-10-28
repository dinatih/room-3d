/**
 * UtakerFrame.tsx — Cadre lit IKEA Utåker (GLB) + matelas et housses procéduraux.
 * upper=false → cadre bas GLB, matelas Vestmarka
 * upper=true → cadre haut GLB, matelas Anneland + surmatelas Nasfjallet
 * Coordonnées locales : centré XZ (longueur sur X), Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF, RoundedBox } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, mergeGlbByMaterial, glbLocalBBox } from '@features/scene/glbUtils';
import * as THREE from 'three';
import type { SceneModelProps } from '@shared/types';

import { Anneland70481722 } from './Anneland70481722';
import { Vestmarka90470195 } from './Vestmarka90470195';

const BAS_GLB  = 'items/utaker00360484/Utaker00360484-1.glb';
const HAUT_GLB = 'items/utaker00360484/Utaker00360484-2.glb';

const redFabricMat = new THREE.MeshPhysicalMaterial({
  color: 0x991111,
  roughness: 0.9,
  clearcoat: 0.0,
  sheen: 1.0,
  sheenColor: new THREE.Color(0xff5555),
  sheenRoughness: 0.6,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});

import { Blaskata50569513 } from './Blaskata50569513';

function RealisticBolsters({ topY, zOffset = -26 }: { topY: number; zOffset?: number }) {
  return (
    <group position={[0, topY + 5, zOffset]}>
      <group position={[-50, 0, 0]} rotation={[0, 0, 0]}>
        <Blaskata50569513 />
      </group>
      <group position={[50, 0, 0]} rotation={[0, 0, 0]}>
        <Blaskata50569513 />
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

interface UtakerFrameProps extends SceneModelProps {
  upper?: boolean;
  hasTopper?: boolean;
}

export function UtakerFrame({ upper: isUpper = false, onSize, hasTopper: explicitTopper }: UtakerFrameProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const glbPath  = isUpper ? HAUT_GLB : BAS_GLB;

  // Par défaut : lit haut (Ouest) a le surmatelas, lit bas (Est) ne l'a pas.
  // En mode double, explicitTopper permet d'inverser (surmatelas sur l'Est pour égaliser 22cm vs 24cm).
  const hasTopper = explicitTopper !== undefined ? explicitTopper : isUpper;

  useLayoutEffect(() => {
    onSize?.(glbLocalBBox(groupRef.current).getSize(new THREE.Vector3()));
  }, [hasTopper, isUpper, onSize]);

  // Matelas base :
  // - Lit Ouest (isUpper) : ÅNNELAND 24cm, pos Y = 11 -> sommet matelas = 11 + 24 = 35cm
  //   - Avec surmatelas (4cm) : sommet = 39cm
  //   - Sans surmatelas : sommet = 35cm
  // - Lit Est (!isUpper) : VESTMARKA 18cm, pos Y = 11 -> sommet matelas = 11 + 18 = 29cm
  //   - Avec surmatelas (4cm) : sommet = 33cm (22cm de literie au dessus du sommier 11cm)
  //   - Sans surmatelas : sommet = 29cm
  const topY = isUpper
    ? (hasTopper ? 39 : 35)
    : (hasTopper ? 33 : 29);

  const drop = isUpper
    ? (hasTopper ? 20 : 16)
    : (hasTopper ? 17 : 14);

  return (
    <group ref={groupRef}>
      <Cadre glbPath={glbPath} />
      <group position={[0, 11, 0]} rotation-y={Math.PI / 2}>
        {isUpper ? <Anneland70481722 /> : <Vestmarka90470195 />}
      </group>
      <RealisticDuvet topY={topY} drop={drop} />
      <RealisticBolsters topY={topY} zOffset={isUpper ? -26 : 26} />
    </group>
  );
}

useGLTF.preload(BAS_GLB);
useGLTF.preload(HAUT_GLB);
