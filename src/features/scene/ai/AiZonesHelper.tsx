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
  const cameraMode = useSceneStore(s => s.cameraMode);
  if (!visible) return null;

  const isTopView = cameraMode === 'top';
  // En vue du dessus, on place les repères visuels bien au-dessus des meubles pour être toujours lisibles
  const baseHeight = isTopView ? 280 : 1.2;
  const labelHeight = isTopView ? 290 : 25;

  return (
    <group renderOrder={9999}>
      {/* ── Points de passage / Waypoints ── */}
      {Object.values(ZONES).map(zone => (
        <group key={`wp-${zone.id}`} position={[zone.x, baseHeight, zone.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[6, 24]} />
            <meshBasicMaterial color="#ffffff" opacity={0.35} transparent depthTest={false} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[5, 6, 24]} />
            <meshBasicMaterial color="#aaaaaa" depthTest={false} depthWrite={false} />
          </mesh>
          <Billboard position={[0, isTopView ? 8 : 15, 0]}>
            <Text
              fontSize={6.5}
              color="#eeeeee"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.7}
              outlineColor="#000000"
              material-depthTest={false}
              material-depthWrite={false}
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
        const slotsCount = obj.slots.length;
        
        // Calcule le centre moyen de tous les slots de l'objet pour un label d'objet unique et propre
        const avgX = obj.slots.reduce((sum, s) => sum + s.offset[0], 0) / (slotsCount || 1);
        const avgZ = obj.slots.reduce((sum, s) => sum + s.offset[2], 0) / (slotsCount || 1);

        // Liste multi-lignes claire des actions du smart object
        const slotsText = obj.slots.map(s => `• ${s.name}`).join('\n');
        const fullLabel = `✨ ${obj.name}\n${slotsText}`;

        return (
          <group key={`smart-${obj.id}`}>
            {/* Label Unique Multi-lignes au-dessus de l'objet (visible à travers tout) */}
            <Billboard position={[avgX, labelHeight, avgZ]}>
              <Text
                fontSize={7.0}
                lineHeight={1.15}
                color={color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.8}
                outlineColor="#000000"
                material-depthTest={false}
                material-depthWrite={false}
                renderOrder={9999}
              >
                {fullLabel}
              </Text>
            </Billboard>

            {/* Cibles au sol + flèches d'orientation pour chaque slot */}
            {obj.slots.map(slot => {
              const pos = slot.offset;
              return (
                <group key={`slot-${obj.id}-${slot.slotId}`} position={[pos[0], baseHeight, pos[2]]}>
                  {/* Cible au sol */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[10, 32]} />
                    <meshBasicMaterial color={color} opacity={0.4} transparent depthTest={false} depthWrite={false} />
                  </mesh>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[8, 10, 32]} />
                    <meshBasicMaterial color={color} depthTest={false} depthWrite={false} />
                  </mesh>
                  {/* Flèche d'orientation */}
                  <mesh rotation={[-Math.PI / 2, 0, -slot.rotY]} position={[0, 0.2, 0]}>
                    <coneGeometry args={[3, 8, 16]} />
                    <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}

    </group>
  );
}


