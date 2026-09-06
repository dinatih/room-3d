import { Famnig27470460 } from '../items/Famnig27470460';

export function HeartParachute({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <group name="Parachute Coeur" userData={{ itemName: 'Parachute Coeur' }} position={[0, 270, 0]}>
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
