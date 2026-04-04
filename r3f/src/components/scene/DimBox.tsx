import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Dims } from '../../types';

export function DimBox({ dims }: { dims: Dims }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(() => { ref.current.rotation.y += 0.005; });

  // dims in cm → scene units (1 unit = 10 cm)
  const [w, hy, d] = [dims.w / 10, dims.h / 10, dims.d / 10];

  return (
    <mesh ref={ref} position={[0, hy / 2, 0]}>
      <boxGeometry args={[w, hy, d]} />
      <meshStandardMaterial color="#2255aa" opacity={0.55} transparent />
    </mesh>
  );
}
