import { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SpatialZone } from '@features/scene/ai/SpatialZone';

// Rendu complet et officiel du Studio
import { Walls, Floor, Mirrors, DoorsPlaced } from '@features/scene/Building';
import { Equipment, Furniture, Furnishings, Decor, Backpacks, Garden, DronaBoxes } from '@features/scene/Placements';

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
 * Rendu officiel du Studio croppé dynamiquement par la BoundingBox 3D de la SpatialZone
 */
function StudioCroppedScene({ zone }: { zone: SpatialZone }) {
  const min = zone.bounds.min;
  const max = zone.bounds.max;

  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  const smartObjects = useMemo(() => zone.getSmartObjects(), [zone]);
  const waypoints = useMemo(() => zone.getWaypoints(), [zone]);

  return (
    <group position={[-center[0], 0, -center[2]]}>
      {/* ── Scène réelle complète de l'appartement ── */}
      <group>
        <Walls />
        <Floor />
        <DoorsPlaced />
        <Equipment />
        <Furniture />
        <Furnishings />
        <Decor />
        <Backpacks />
        <Garden />
        <DronaBoxes />
        <Mirrors />
      </group>

      {/* ── Marqueurs Waypoints de la pièce ── */}
      {waypoints.map(wp => (
        <group key={wp.id} position={[wp.x, 2, wp.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[6, 8, 24]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} />
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

      {/* ── Marqueurs SmartObjects de la pièce ── */}
      {smartObjects.map(obj => {
        const color = CATEGORY_COLORS[obj.category] || '#00e5ff';
        return (
          <group key={obj.id} position={[obj.position[0], 2, obj.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[8, 24]} />
              <meshBasicMaterial color={color} opacity={0.3} transparent depthTest={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[7, 9, 24]} />
              <meshBasicMaterial color={color} depthTest={false} />
            </mesh>
            <Html position={[0, 14, 0]} center distanceFactor={180}>
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
  height = 340
}: {
  zone: SpatialZone;
  height?: number | string;
}) {
  const maxDim = Math.max(
    zone.bounds.max[0] - zone.bounds.min[0],
    zone.bounds.max[2] - zone.bounds.min[2]
  );
  const camDistance = Math.max(220, maxDim * 1.25);

  const min = zone.bounds.min;
  const max = zone.bounds.max;

  // 6 clipping planes Three.js pour le renderer
  const clippingPlanes = useMemo(() => {
    const pad = 2;
    return [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), -(min[0] - pad)),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), max[0] + pad),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -(min[1] - pad)),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), max[1] + pad),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -(min[2] - pad)),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), max[2] + pad),
    ];
  }, [min, max]);

  return (
    <div style={{ width: '100%', height, position: 'relative', background: '#0b1120', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [camDistance * 0.8, camDistance * 0.7, camDistance * 0.8], fov: 42, near: 1, far: 5000 }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.clippingPlanes = clippingPlanes;
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[200, 400, 200]} intensity={2.0} />
        <directionalLight position={[-200, 300, -200]} intensity={1.0} />

        <Suspense fallback={null}>
          <StudioCroppedScene zone={zone} />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minDistance={40}
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
        <span>Vue Studio Découpée : {zone.name}</span>
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

