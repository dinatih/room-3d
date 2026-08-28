import { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { SpatialZone } from '@features/scene/ai/SpatialZone';

// Composants d'équipements / meubles pour les pièces
import { Toilet } from '@features/scene/items/Toilet';
import { Shower } from '@features/scene/items/Shower';
import { VasqueSdb } from '@features/scene/items/VasqueSdb';
import { WaterHeater } from '@features/scene/items/WaterHeater';
import { SdbCloset } from '@features/scene/items/SdbCloset';
import { BathroomCabinetWest, BathroomCabinetEast } from '@features/scene/items/BathroomCabinet';
import { CorridorCloset } from '@features/scene/items/CorridorCloset';
import { UtakerFrame } from '@features/scene/items/UtakerFrame';
import { BollsidanDesk } from '@features/scene/items/BollsidanDesk';
import { CuisineGroup } from '@features/scene/items/CuisineGroup';
import { Freezer } from '@features/scene/items/Freezer';
import { ArmrestSofa } from '@features/scene/items/ArmrestSofa';
import { ArmlessSofa } from '@features/scene/items/ArmlessSofa';
import { Bathtub } from '@features/scene/items/Bathtub';
import { GrassRug } from '@features/scene/items/GrassRug';
import { NOOP_ITEM, NOOP_SIZE, NOOP_STATE } from '@features/scene/sceneItem';

const CATEGORY_COLORS: Record<string, string> = {
  bed: '#ff4081',
  seating: '#00e5ff',
  hygiene: '#00e676',
  surface: '#ffab00',
  storage: '#ffd600',
  appliance: '#e040fb',
  outdoor: '#76ff03',
  decor: '#b388ff',
};

/**
 * Rendu 3D spécifique d'une SpatialZone isolée
 */
function IsolatedZoneContent({ zone }: { zone: SpatialZone }) {
  const min = zone.bounds.min;
  const max = zone.bounds.max;

  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  const size: [number, number, number] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];

  const smartObjects = useMemo(() => zone.getSmartObjects(), [zone]);
  const waypoints = useMemo(() => zone.getWaypoints(), [zone]);

  return (
    <group position={[-center[0], 0, -center[2]]}>
      {/* Sol de la pièce */}
      <mesh position={[center[0], -0.2, center[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial
          color={zone.environment === 'outdoor' ? '#3a7d44' : (zone.id === 'bathroom' ? '#e2e8f0' : '#d4a437')}
          roughness={0.7}
        />
      </mesh>

      {/* Boîte englobante transparente */}
      <mesh position={[center[0], size[1] / 2, center[2]]}>
        <boxGeometry args={[size[0], size[1], size[2]]} />
        <meshBasicMaterial color="#0058a3" opacity={0.06} transparent wireframe />
      </mesh>

      {/* ── Contenu 3D dédié par pièce ── */}
      {zone.id === 'bathroom' && (
        <group>
          {/* Murs carrelés SDB */}
          <mesh position={[91, 125, 400]}>
            <boxGeometry args={[202, 250, 4]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          <mesh position={[-10, 125, 540]}>
            <boxGeometry args={[4, 250, 280]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>

          {/* Équipements SDB */}
          <group position={[50, 0, 500]}>
            <Toilet item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[116, 0, 545]}>
            <VasqueSdb item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[25, 0, 645]}>
            <Shower item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[130, 0, 600]}>
            <SdbCloset item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[30, 0, 487]}>
            <BathroomCabinetWest item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[169, 0, 487]}>
            <BathroomCabinetEast item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[140, 160, 470]}>
            <WaterHeater item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </group>
      )}

      {zone.id === 'corridor' && (
        <group>
          <group position={[220, 0, 435]}>
            <CorridorCloset item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </group>
      )}

      {zone.id === 'living' && (
        <group>
          <group position={[74, 0, 151.5]}>
            <UtakerFrame item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[270, 0, 190]}>
            <UtakerFrame item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[75, 0, 60]}>
            <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[200, 0, 215]}>
            <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[80, 0, 370]}>
            <CuisineGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[250, 0, 320]}>
            <Freezer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </group>
      )}

      {zone.id === 'garden' && (
        <group>
          <group position={[270, 0, -110]}>
            <ArmrestSofa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[100, 0, -80]}>
            <ArmlessSofa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[120, 0, -300]}>
            <Bathtub item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
          <group position={[120, 0, -100]}>
            <GrassRug item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        </group>
      )}

      {/* ── Waypoints de navigation de la pièce ── */}
      {waypoints.map(wp => (
        <group key={wp.id} position={[wp.x, 1, wp.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[6, 8, 24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <Html position={[0, 10, 0]} center distanceFactor={180}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              border: '1px solid #ffffff',
              pointerEvents: 'none'
            }}>
              📍 {wp.name || wp.id}
            </div>
          </Html>
        </group>
      ))}

      {/* ── SmartObjects et slots de la pièce ── */}
      {smartObjects.map(obj => {
        const color = CATEGORY_COLORS[obj.category] || '#00e5ff';
        return (
          <group key={obj.id} position={[obj.position[0], 2, obj.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[10, 24]} />
              <meshBasicMaterial color={color} opacity={0.3} transparent />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[8, 10, 24]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <Html position={[0, 15, 0]} center distanceFactor={180}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                color: color,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                border: `1px solid ${color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}>
                ✨ {obj.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function SpatialZonePreview({
  zone,
  height = 320
}: {
  zone: SpatialZone;
  height?: number | string;
}) {
  const maxDim = Math.max(
    zone.bounds.max[0] - zone.bounds.min[0],
    zone.bounds.max[2] - zone.bounds.min[2]
  );
  const camDistance = Math.max(250, maxDim * 1.3);

  return (
    <div style={{ width: '100%', height, position: 'relative', background: '#0b1120', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [camDistance * 0.8, camDistance * 0.8, camDistance * 0.8], fov: 40, near: 1, far: 5000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[200, 400, 200]} intensity={2.0} castShadow />
        <directionalLight position={[-200, 300, -200]} intensity={1.0} />

        <Suspense fallback={null}>
          <IsolatedZoneContent zone={zone} />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02} // Empêche de passer sous le sol
          minDistance={50}
          maxDistance={camDistance * 3}
        />
      </Canvas>

      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(15, 23, 42, 0.85)',
        color: '#ffffff',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(4px)'
      }}>
        <span>{zone.environment === 'indoor' ? '🏠' : '🌳'}</span>
        <span>Vue Isolée : {zone.name}</span>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        background: 'rgba(15, 23, 42, 0.75)',
        color: '#94a3b8',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        pointerEvents: 'none'
      }}>
        Clic gauche : rotation • Molette : zoom • Clic droit : translation
      </div>
    </div>
  );
}
