import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function WigDebug() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.01;
      ref.current.rotation.y += 0.01;
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[10, 10, 10]} />
      <meshBasicMaterial color="red" wireframe />
    </mesh>
  );
}
