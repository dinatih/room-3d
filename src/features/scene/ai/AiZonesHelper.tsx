import { useSceneStore } from '../store/useSceneStore';
import { ZONES } from './ZoneNodes';
import { SMART_OBJECTS } from './smartObjectRegistry';
import { Text, Billboard } from '@react-three/drei';

const CATEGORY_COLORS: Record<string, string> = {
  bed: '#ff4081',
  seating: '#00e5ff',
  hygiene: '#00e676',
  surface: '#ffab00',
  storage: '#ffd600',
  appliance: '#e040fb',
  outdoor: '#76ff03',
  decor: '#b388ff',
  door: '#ff5252'
};

export function AiZonesHelper() {
  const visible = useSceneStore(s => s.layers.aiZones);
  if (!visible) return null;

  return (
    <group>
      {/* ── Points de passage / Waypoints ── */}
      {Object.values(ZONES).map(zone => (
        <group key={`wp-${zone.id}`} position={[zone.x, 1, zone.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[6, 24]} />
            <meshBasicMaterial color="#ffffff" opacity={0.25} transparent depthTest={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[5, 6, 24]} />
            <meshBasicMaterial color="#aaaaaa" depthTest={false} />
          </mesh>
          <Billboard position={[0, 15, 0]}>
            <Text
              fontSize={6}
              color="#cccccc"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.6}
              outlineColor="#000000"
              depthOffset={-50}
              material-depthTest={false}
              renderOrder={9998}
            >
              {`📍 ${zone.id}`}
            </Text>
          </Billboard>
        </group>
      ))}

      {/* ── Smart Objects et leurs Slots d'affordance ── */}
      {Object.values(SMART_OBJECTS).map(obj => {
        const color = CATEGORY_COLORS[obj.category] || '#00ff88';
        return (
          <group key={`smart-${obj.id}`}>
            {obj.slots.map(slot => {
              const pos = slot.offset;
              return (
                <group key={`slot-${obj.id}-${slot.slotId}`} position={[pos[0], 1.2, pos[2]]}>
                  {/* Cible au sol */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[10, 32]} />
                    <meshBasicMaterial color={color} opacity={0.35} transparent depthTest={false} />
                  </mesh>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[8, 10, 32]} />
                    <meshBasicMaterial color={color} depthTest={false} />
                  </mesh>
                  {/* Flèche d'orientation */}
                  <mesh rotation={[-Math.PI / 2, 0, -slot.rotY]} position={[0, 0.2, 0]}>
                    <coneGeometry args={[3, 8, 16]} />
                    <meshBasicMaterial color="#ffffff" depthTest={false} />
                  </mesh>
                  {/* Label Smart Object + Slot */}
                  <Billboard position={[0, 24, 0]}>
                    <Text
                      fontSize={7.5}
                      color={color}
                      anchorX="center"
                      anchorY="middle"
                      outlineWidth={0.8}
                      outlineColor="#000000"
                      depthOffset={-100}
                      material-depthTest={false}
                      renderOrder={9999}
                    >
                      {`✨ ${obj.name}\n[${slot.name}]`}
                    </Text>
                  </Billboard>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

