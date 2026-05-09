/**
 * Neighbors.tsx — appartements voisins (fantômes semi-transparents).
 * Clone le groupe Walls du studio principal et applique un matériau ghost.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { ROOM_W } from '@config';
import { wallsGroupRef } from './Building';

const neighborMat = new THREE.MeshStandardMaterial({
  color: 0xa8c8e8, roughness: 0.85,
  transparent: true, opacity: 0.35, depthWrite: false,
  side: THREE.DoubleSide,
});

function NeighborApartment({ offsetX, offsetZ }: { offsetX: number; offsetZ: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    const src = wallsGroupRef.current;
    const dst = groupRef.current;
    if (!src || !dst) return;

    const clone = src.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = neighborMat;
      mesh.castShadow = false;
    });
    dst.add(clone);
    invalidate();

    return () => { dst.remove(clone); };
  }, [invalidate]);

  return <group ref={groupRef} position={[offsetX, 0, offsetZ]} />;
}

export function Neighbors() {
  return (
    <>
      <NeighborApartment offsetX={-ROOM_W - 30.5} offsetZ={200} />
      <NeighborApartment offsetX={ROOM_W + 30.5}  offsetZ={-200} />
    </>
  );
}
