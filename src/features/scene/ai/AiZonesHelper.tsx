import { useSceneStore } from '../store/useSceneStore';
import { ZONES } from './ZoneNodes';
import { Text, Billboard } from '@react-three/drei';

export function AiZonesHelper() {
  const visible = useSceneStore(s => s.layers.aiZones);
  if (!visible) return null;

  return (
    <group>
      {Object.values(ZONES).map(zone => (
        <group key={zone.id} position={[zone.x, 1, zone.z]}>
          {/* Cible au sol */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[10, 32]} />
            <meshBasicMaterial color="#00ff88" opacity={0.4} transparent depthTest={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[8, 10, 32]} />
            <meshBasicMaterial color="#00ff88" depthTest={false} />
          </mesh>
          {/* Point central */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2, 16]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} />
          </mesh>
          {/* Texte du nom et position */}
          <Billboard position={[0, 20, 0]}>
            <Text
              key={`text-${zone.id}`}
              fontSize={8}
              color="#00ff88"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.8}
              outlineColor="#000000"
              material-depthTest={false}
            >
              {`${zone.id}\n(${Math.round(zone.x)}, ${Math.round(zone.z)})`}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  );
}
