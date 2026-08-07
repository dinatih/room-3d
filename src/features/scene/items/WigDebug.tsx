import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function WigDebug() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.01;
      ref.current.rotation.y += 0.01;
      
      const pos = new THREE.Vector3();
      ref.current.getWorldPosition(pos);
      if (Math.random() < 0.01) {
        console.log("WigDebug World Pos:", pos.x, pos.y, pos.z);
      }
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[20, 20, 20]} />
      <meshBasicMaterial color="red" wireframe />
    </mesh>
  );
}
