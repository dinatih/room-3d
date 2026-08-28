import { useState, useMemo, useEffect, useRef, useLayoutEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SpatialZone } from '@features/scene/ai/SpatialZone';

// Rendu complet et officiel du Studio
import { Walls, Floor, Mirrors, DoorsPlaced } from '@features/scene/Building';
import { Equipment, Furniture, Furnishings, Decor, Backpacks, Garden, DronaBoxes } from '@features/scene/Placements';
import { SkySphere } from '@features/scene/SkySphere';

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
 * Rendu officiel du Studio croppé en local pour que la SkySphere et le fond céleste restent intacts
 */
function StudioCroppedScene({ zone }: { zone: SpatialZone }) {
  const min = zone.bounds.min;
  const max = zone.bounds.max;
  const studioGroupRef = useRef<THREE.Group>(null);

  // 6 plans de coupe orthogonaux pour découper exclusivement les objets du studio
  const clippingPlanes = useMemo(() => {
    const pad = 1;
    return [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), -(min[0] - pad)),   // X >= minX - pad
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), max[0] + pad),    // X <= maxX + pad
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -(min[1] - pad)),   // Y >= minY - pad
      new THREE.Plane(new THREE.Vector3(0, -1, 0), max[1] + pad),   // Y <= maxY + pad
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -(min[2] - pad)),   // Z >= minZ - pad
      new THREE.Plane(new THREE.Vector3(0, 0, -1), max[2] + pad),   // Z <= maxZ + pad
    ];
  }, [min, max]);

  // Applique les clipping planes localement sur tous les matériaux des meshes de la pièce
  useLayoutEffect(() => {
    if (!studioGroupRef.current) return;
    studioGroupRef.current.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => {
            m.clippingPlanes = clippingPlanes;
            m.clipShadows = true;
            m.needsUpdate = true;
          });
        } else if (mesh.material) {
          mesh.material.clippingPlanes = clippingPlanes;
          mesh.material.clipShadows = true;
          mesh.material.needsUpdate = true;
        }
      }
    });
  }, [clippingPlanes]);

  const smartObjects = useMemo(() => zone.getSmartObjects(), [zone]);
  const waypoints = useMemo(() => zone.getWaypoints(), [zone]);

  return (
    <group>
      {/* Ciel panoramique réaliste — non soumis aux plans de coupe */}
      <SkySphere />

      {/* ── Scène réelle complète de l'appartement — soumise au découpage de la pièce ── */}
      <group ref={studioGroupRef}>
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
  const min = zone.bounds.min;
  const max = zone.bounds.max;

  const centerX = (min[0] + max[0]) / 2;
  const centerY = (min[1] + max[1]) / 2;
  const centerZ = (min[2] + max[2]) / 2;

  const maxDim = Math.max(max[0] - min[0], max[2] - min[2]);
  const camDistance = Math.max(220, maxDim * 1.35);

  const [isTopView, setIsTopView] = useState(false);

  // Raccourci clavier 'T' pour basculer en Vue du dessus (Top View)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement;
      if (targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.isContentEditable)) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setIsTopView(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const camPosition: [number, number, number] = isTopView
    ? [centerX, camDistance * 1.8, centerZ + 0.01]
    : [centerX + camDistance * 0.75, centerY + camDistance * 0.7, centerZ + camDistance * 0.75];

  return (
    <div style={{ width: '100%', height, position: 'relative', background: '#0b1120', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: camPosition, fov: 42, near: 1, far: 8000 }}
        key={`${zone.id}-${isTopView ? 'top' : 'persp'}`}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl, camera }) => {
          gl.localClippingEnabled = true;
          camera.layers.enableAll();
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
          target={[centerX, centerY, centerZ]}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={isTopView ? Math.PI / 2 : Math.PI / 2 - 0.02}
          minDistance={40}
          maxDistance={camDistance * 3.5}
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
        <span>Vue Découpée : {zone.name}</span>
      </div>

      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        gap: 6
      }}>
        <button
          onClick={() => setIsTopView(prev => !prev)}
          style={{
            background: isTopView ? '#0284c7' : 'rgba(15, 23, 42, 0.85)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}
        >
          {isTopView ? '📐 Vue 3D Persp (T)' : '🗺️ Vue Top (T)'}
        </button>
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
        Touche <b>T</b> : Vue Dessus • Clic gauche : rotation • Molette : zoom • Clic droit : translation
      </div>
    </div>
  );
}


