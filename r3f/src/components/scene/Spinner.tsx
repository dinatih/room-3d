import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Spinner() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 2;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[12, 3, 8, 24]} />
      <meshStandardMaterial color="#ffd700" wireframe />
    </mesh>
  );
}
