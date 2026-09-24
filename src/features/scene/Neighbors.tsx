/**
 * Neighbors.tsx — appartements voisins (fantômes semi-transparents).
 * Clone le groupe Walls du studio principal et applique un matériau ghost.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

import { wallsGroupRef } from './Building';
import { LAYER_NEIGHBORS } from '@config';
import { useSceneStore } from './store/useSceneStore';

const neighborMat = new THREE.MeshStandardMaterial({
  color: 0xa8c8e8, roughness: 0.85,
  transparent: true, opacity: 0.35, depthWrite: false,
  side: THREE.DoubleSide,
});

function NeighborApartment({ offsetX, offsetZ }: { offsetX: number; offsetZ: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const pillarsOnly = useSceneStore((state) => state.layers.pillarsOnly);

  useLayoutEffect(() => {
    const src = wallsGroupRef.current;
    const dst = groupRef.current;
    if (!src || !dst) return;

    const clone = src.clone(true);
    clone.traverse((o) => {
      o.frustumCulled = false;
      o.layers.set(LAYER_NEIGHBORS);
      o.userData = { ...o.userData, noAnim: true };
      delete (o.userData as any).animUnit;
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      mesh.material = neighborMat;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
    dst.add(clone);
    invalidate();

    return () => { dst.remove(clone); };
  }, [invalidate, pillarsOnly]);

  return <group ref={groupRef} position={[offsetX, 0, offsetZ]} />;
}

export function Neighbors() {
  return (
    <>
      <NeighborApartment offsetX={-346} offsetZ={199.76} />
      <NeighborApartment offsetX={346}  offsetZ={-199.76} />
    </>
  );
}
