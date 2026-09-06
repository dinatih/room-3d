import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { Famnig27470460 } from '../items/Famnig27470460';

export function HeartParachute({ currentAnimClip }: { currentAnimClip: React.MutableRefObject<string | null> }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = currentAnimClip.current === 'animations/locomotion/anim_falling.glb';
    }
  });

  return (
    <group ref={groupRef} name="Parachute Coeur" userData={{ itemName: 'Parachute Coeur' }} position={[0, 270, 0]} visible={false}>
      <mesh position={[0, -60, 0]} userData={{ itemName: 'Parachute Coeur' }}>
        <cylinderGeometry args={[0.5, 0.5, 120, 8]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.9} />
      </mesh>
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} userData={{ itemName: 'Parachute Coeur' }}>
        <Famnig27470460 item={{} as any} actionState={{} as any} onSize={() => {}} />
      </group>
    </group>
  );
}
