import { memo, useState, useMemo, useEffect, useRef, useLayoutEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { OrbitControls } from '@features/scene/camera/OrbitControls';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getOrbitMouseButtons, getOrbitTouches } from '@features/scene/camera/orbitMouseButtons';
import * as THREE from 'three';
import { NavigationEnabledContext } from '@features/scene/ai/navigation/NavigationContext';
import { SpatialZone } from '@features/scene/ai/SpatialZone';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { DevToolsCollector } from '@features/scene/DevToolsCollector';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { CategoryLayerGroup, LayerRegistryContext } from '@features/scene/sceneLayer';
import { CharacterGroup } from '@features/scene/character';
import { Animals } from '@features/scene/Placements';
import { Neighbors } from '@features/scene/Neighbors';
import { LidarScan } from '@features/scene/LidarScan';
import { WallEdgesLayer } from '@features/scene/WallEdgesLayer';
import {
  LAYER_WALKER_DETAIL, LAYER_WALKER, LAYER_WALL_STRUCTURE, LAYER_DOORS, LAYER_EQUIPMENT,
  LAYER_FURNITURE, LAYER_FURNISHINGS, LAYER_DECOR, LAYER_ANIMALS,
  LAYER_MIRRORS, LAYER_NEIGHBORS, LAYER_LIDAR,
} from '@config';

// Rendu complet et officiel du Studio
import { Walls, Floor, MirrorFrames, MirrorReflectors, DoorsPlacement } from '@features/scene/Building';
import { Equipment, Furniture, Furnishings, Decor } from '@features/scene/Placements';
import { SkySphere } from '@features/scene/SkySphere';
import { useIsMobile } from '@shared/hooks/useIsMobile';

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

const CAMERA_VIEW_DIRECTIONS: Record<string, [number, number, number]> = {
  front: [0, 0, 1], back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0],
  top: [0, 1, 0], bottom: [0, -1, 0],
  'iso-se': [1, 1, 1], 'iso-sw': [-1, 1, 1], 'iso-ne': [1, 1, -1], 'iso-nw': [-1, 1, -1],
  's-e': [1, 1, 1], 's-o': [-1, 1, 1], 'n-e': [1, 1, -1], 'n-o': [-1, 1, -1],
  perspective: [0.3, 0.25, 1],
};

function PreviewCategoryLayerGroup({
  layer, children, visible = true, wireframe = false,
}: {
  layer: number;
  children: React.ReactNode;
  visible?: boolean;
  wireframe?: boolean;
}) {
  return <CategoryLayerGroup layer={layer} visible={visible} wireframe={wireframe} register={false}>{children}</CategoryLayerGroup>;
}

/**
 * Rendu officiel du Studio croppé en local pour que la SkySphere et le fond céleste restent intacts
 */
function StudioCroppedScene({ zone }: { zone: SpatialZone }) {
  const layers = useSceneStore(state => state.layers);
  const showZoneUi = layers.aiZones;
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
    const group = studioGroupRef.current;
    if (!group) return;
    const applyClipping = (root: THREE.Object3D) => {
      root.traverse((child: THREE.Object3D) => {
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
    };
    const onChildAdded = (event: any) => { if (event.child) applyClipping(event.child); };
    applyClipping(group);
    group.addEventListener('childadded', onChildAdded);
    return () => group.removeEventListener('childadded', onChildAdded);
  }, [clippingPlanes]);

  const smartObjects = useMemo(() => zone.getSmartObjects(), [zone]);

  return (
    <group>
      {/* Ciel panoramique réaliste — non soumis aux plans de coupe */}
      <SkySphere />

      {/* ── Scène réelle complète de l'appartement — soumise au découpage de la pièce ── */}
      <LayerRegistryContext.Provider value={false}>
      <group ref={studioGroupRef} visible={!layers.plan}>
        <PreviewCategoryLayerGroup
          layer={LAYER_WALL_STRUCTURE}
          visible={layers.wallStructure}
          wireframe={layers.wireframe || layers.wireframeWallStructure}
        >
          <Walls pillarsOnly={layers.pillarsOnly} />
        </PreviewCategoryLayerGroup>
        <PreviewCategoryLayerGroup layer={LAYER_DOORS} visible={layers.doors} wireframe={layers.wireframe || layers.wireframeDoors}>
          {!layers.pillarsOnly && <DoorsPlacement />}
        </PreviewCategoryLayerGroup>
        <Floor />
        <PreviewCategoryLayerGroup layer={LAYER_WALKER} visible={layers.character}>
          <CharacterGroup />
        </PreviewCategoryLayerGroup>
        <PreviewCategoryLayerGroup layer={LAYER_EQUIPMENT} visible={layers.equipment}><Equipment /></PreviewCategoryLayerGroup>
        <PreviewCategoryLayerGroup layer={LAYER_FURNITURE} visible={layers.furniture}><Furniture /></PreviewCategoryLayerGroup>
        <PreviewCategoryLayerGroup layer={LAYER_FURNISHINGS} visible={layers.furnishings}>
          <Furnishings />
          <MirrorFrames />
        </PreviewCategoryLayerGroup>
        <PreviewCategoryLayerGroup layer={LAYER_DECOR} visible={layers.decor}><Decor /></PreviewCategoryLayerGroup>
        <PreviewCategoryLayerGroup layer={LAYER_ANIMALS} visible={layers.animals}><Animals /></PreviewCategoryLayerGroup>
        <PreviewCategoryLayerGroup layer={LAYER_MIRRORS} visible={layers.mirrors}><MirrorReflectors /></PreviewCategoryLayerGroup>
        {layers.neighbors && (
          <PreviewCategoryLayerGroup layer={LAYER_NEIGHBORS} visible={layers.neighbors}><Neighbors /></PreviewCategoryLayerGroup>
        )}
        {layers.lidar && (
          <PreviewCategoryLayerGroup layer={LAYER_LIDAR} visible={layers.lidar}>
            <LidarScan mode={0} opacity={0.55} />
          </PreviewCategoryLayerGroup>
        )}
      </group>
      {layers.wallEdges && <WallEdgesLayer isolated clippingPlanes={clippingPlanes} />}
      </LayerRegistryContext.Provider>

      {/* ── Marqueurs SmartObjects de la pièce ── */}
      {showZoneUi && smartObjects.map(obj => {
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
            <Html position={[0, 14, 0]} center transform={false} sprite>
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

// FPS and render-stat updates belong to the HUD. Keep them from reconciling
// the full apartment's furniture tree several times per second.
const MemoizedStudioCroppedScene = memo(StudioCroppedScene);


function SpatialZoneStatsCollector({ onStats }: { onStats?: (s: { triangles: number; drawCalls: number }) => void }) {
  const { gl } = useThree();
  const lastReportRef = useRef<number>(0);

  useFrame(() => {
    if (!onStats) return;
    const now = performance.now();
    if (now - lastReportRef.current > 500) {
      lastReportRef.current = now;
      const render = gl.info.render;
      if (render) {
        onStats({
          triangles: render.triangles,
          drawCalls: render.calls,
        });
      }
    }
  });

  return null;
}

// ── Camera view controller for preview ────────────────────────────────────

function PreviewCameraController({
  centerX, centerY, centerZ, camDistance, zoneSize,
}: {
  centerX: number; centerY: number; centerZ: number; camDistance: number; zoneSize: number;
}) {
  const { camera, set, size } = useThree();
  const ctrlRef = useRef<OrbitControlsImpl>(null!);
  const orthoCamRef = useRef<THREE.OrthographicCamera | null>(null);
  const perspCamRef = useRef<THREE.PerspectiveCamera | null>(null);

  const DIST = camDistance;
  const orthoHalf = Math.max(80, zoneSize * 0.75);
  const cameraProjection = useSceneStore(s => s.cameraProjection);
  const orbitMouseMode = useSceneStore(s => s.orbitMouseMode);
  const activeCameraPos = useSceneStore(s => s.activeCameraPos);
  const controlsTarget = useMemo<[number, number, number]>(() => [centerX, centerY, centerZ], [centerX, centerY, centerZ]);

  // Initialize both preview cameras from the active scene view. The inventory
  // can mount after the main scene has already dispatched its camera preset.
  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera;
    perspCamRef.current = perspCam;
    const aspect = size.width / Math.max(1, size.height);
    const oc = new THREE.OrthographicCamera(-orthoHalf * aspect, orthoHalf * aspect, orthoHalf, -orthoHalf, -20000, 50000);
    // Studio meshes live on category-specific Three.js layers; match the
    // perspective camera configured by Canvas.onCreated.
    oc.layers.enableAll();
    oc.layers.disable(LAYER_WALKER_DETAIL);
    const direction = new THREE.Vector3(...(CAMERA_VIEW_DIRECTIONS[activeCameraPos ?? 'iso-se'] ?? [1, 1, 1])).normalize();
    const initialPosition = new THREE.Vector3(centerX, centerY, centerZ).addScaledVector(direction, DIST);
    perspCam.position.copy(initialPosition);
    perspCam.up.set(0, 1, 0);
    perspCam.lookAt(centerX, centerY, centerZ);
    perspCam.updateProjectionMatrix();
    oc.position.copy(initialPosition);
    oc.up.set(0, 1, 0);
    oc.lookAt(centerX, centerY, centerZ);
    oc.updateProjectionMatrix();
    orthoCamRef.current = oc;
    if (cameraProjection === 'ortho') {
      set({ camera: oc });
      requestAnimationFrame(() => {
        if (ctrlRef.current) {
          ctrlRef.current.object = oc;
          ctrlRef.current.target.set(centerX, centerY, centerZ);
          ctrlRef.current.update();
        }
      });
    }
  }, []);

  // Sync projection toggle from the global store
  const prevProjRef = useRef(cameraProjection);
  useEffect(() => {
    if (prevProjRef.current === cameraProjection) return;
    prevProjRef.current = cameraProjection;

    const orthoCam = orthoCamRef.current;
    const perspCam = perspCamRef.current;
    if (!orthoCam || !perspCam) return;

    if (cameraProjection === 'ortho') {
      orthoCam.position.copy(camera.position);
      orthoCam.up.copy(camera.up);
      const aspect = size.width / Math.max(1, size.height);
      orthoCam.left = -orthoHalf * aspect;
      orthoCam.right = orthoHalf * aspect;
      orthoCam.top = orthoHalf;
      orthoCam.bottom = -orthoHalf;
      orthoCam.zoom = 1;
      orthoCam.updateProjectionMatrix();
      orthoCam.lookAt(centerX, centerY, centerZ);
      set({ camera: orthoCam });
      if (ctrlRef.current) {
        ctrlRef.current.object = orthoCam;
        ctrlRef.current.target.set(centerX, centerY, centerZ);
        ctrlRef.current.update();
      }
    } else {
      perspCam.position.copy(camera.position);
      perspCam.up.copy(camera.up);
      perspCam.lookAt(centerX, centerY, centerZ);
      set({ camera: perspCam });
      if (ctrlRef.current) {
        ctrlRef.current.object = perspCam;
        ctrlRef.current.target.set(centerX, centerY, centerZ);
        ctrlRef.current.update();
      }
    }
  }, [cameraProjection, size.width, size.height]);

  // Keep the orthographic frustum matched to the preview panel as it resizes.
  useEffect(() => {
    const orthoCam = orthoCamRef.current;
    if (!orthoCam) return;
    const aspect = size.width / Math.max(1, size.height);
    orthoCam.left = -orthoHalf * aspect;
    orthoCam.right = orthoHalf * aspect;
    orthoCam.top = orthoHalf;
    orthoCam.bottom = -orthoHalf;
    orthoCam.updateProjectionMatrix();
  }, [size.width, size.height, orthoHalf]);

  // Apply camera-view presets
  useEffect(() => {
    const onView = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.projection === 'ortho' || detail.projection === 'persp') {
        useSceneStore.getState().setCameraProjection(detail.projection);
      }
      const { pos, target, key } = detail as {
        pos: [number, number, number];
        target: [number, number, number];
        key?: string;
      };

      // The shared presets are expressed in the apartment's world coordinates.
      // A zone preview needs the same direction, recentered and scaled locally.
      const fallback = new THREE.Vector3(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]).normalize();
      const direction = key && CAMERA_VIEW_DIRECTIONS[key]
        ? new THREE.Vector3(...CAMERA_VIEW_DIRECTIONS[key]).normalize()
        : fallback;
      const dx = direction.x;
      const dy = direction.y;
      const dz = direction.z;
      const roomDist = Math.hypot(dx, dy, dz) || 1;
      const scale = Math.max(camDistance, zoneSize * 1.8) / roomDist;

      const newPos: [number, number, number] = [
        centerX + dx * scale,
        centerY + dy * scale,
        centerZ + dz * scale,
      ];

      const activeCam = ctrlRef.current?.object || camera;
      activeCam.position.set(...newPos);
      activeCam.up.set(0, 1, 0);
      activeCam.lookAt(centerX, centerY, centerZ);
      activeCam.updateProjectionMatrix();

      if (ctrlRef.current) {
        ctrlRef.current.target.set(centerX, centerY, centerZ);
        ctrlRef.current.update();
      }
    };

    document.addEventListener('camera-view', onView);
    return () => document.removeEventListener('camera-view', onView);
  }, [camera, centerX, centerY, centerZ, DIST, camDistance, zoneSize]);

  return (
    <OrbitControls
      ref={ctrlRef}
      makeDefault
      mouseButtons={getOrbitMouseButtons(orbitMouseMode)}
      touches={getOrbitTouches(orbitMouseMode)}
      target={controlsTarget}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI}
      minDistance={40}
      maxDistance={camDistance * 3.5}
    />
  );
}

export function SpatialZonePreview({
  zone,
  height = '100%',
  onStats,
}: {
  zone: SpatialZone;
  height?: number | string;
  onStats?: (s: { triangles: number; drawCalls: number }) => void;
}) {
  const min = zone.bounds.min;
  const max = zone.bounds.max;

  const centerX = (min[0] + max[0]) / 2;
  const centerY = (min[1] + max[1]) / 2;
  const centerZ = (min[2] + max[2]) / 2;

  const maxDim = Math.max(max[0] - min[0], max[2] - min[2]);
  const camDistance = Math.max(220, maxDim * 1.35);

  const isMobile = useIsMobile();
  const [showFpsGraph, setShowFpsGraph] = useState(() => !isMobile);
  const showZoneUi = useSceneStore(state => state.layers.aiZones);
  const toggleLayer = useSceneStore(state => state.toggleLayer);

  const camPosition: [number, number, number] = [
    centerX + camDistance * 0.75, centerY + camDistance * 0.7, centerZ + camDistance * 0.75,
  ];

  return (
    <div style={{ width: '100%', height, aspectRatio: '1 / 1', maxHeight: '65vh', position: 'relative', background: '#0b1120', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: camPosition, fov: 42, near: 1, far: 8000 }}
        key={zone.id}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl, camera }) => {
          gl.localClippingEnabled = true;
          camera.layers.enableAll();
          camera.layers.disable(LAYER_WALKER_DETAIL);
        }}
      >
        {/* Match the main canvas: lower pixel density when frame times rise. */}
        <AdaptiveDpr pixelated />
        <PerformanceMonitor />
        <ambientLight intensity={1.5} />
        <directionalLight position={[200, 400, 200]} intensity={2.0} />
        <directionalLight position={[-200, 300, -200]} intensity={1.0} />

        <Suspense fallback={null}>
          <NavigationEnabledContext.Provider value={false}><MemoizedStudioCroppedScene zone={zone} /></NavigationEnabledContext.Provider>
        </Suspense>

        <DevToolsCollector />
        <SpatialZoneStatsCollector onStats={onStats} />

        <PreviewCameraController
          centerX={centerX}
          centerY={centerY}
          centerZ={centerZ}
          camDistance={camDistance}
          zoneSize={maxDim}
        />
      </Canvas>

      <div className="position-absolute top-0 start-0 m-2 z-1 d-flex flex-column align-items-start gap-1">
        {showFpsGraph ? (
          <div className="inventory-mini-perf glass-card shadow-lg rounded-2 p-1 position-relative" style={{ width: 190 }}>
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 m-1"
              style={{ fontSize: '0.6rem', zIndex: 2 }}
              onClick={() => setShowFpsGraph(false)}
              title="Masquer les performances"
              aria-label="Masquer les performances"
            />
            <DevToolsGroups Group={({ children }: any) => <>{children}</>} compact headerless />
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-dark bg-opacity-75 border-secondary text-white shadow-sm p-1 d-flex align-items-center justify-content-center"
            style={{ width: 28, height: 28, borderRadius: 6 }}
            onClick={() => setShowFpsGraph(true)}
            title="Afficher les performances"
            aria-label="Afficher les performances"
          >
            <i className="bi bi-bar-chart-fill" style={{ fontSize: 13 }} aria-hidden="true" />
          </button>
        )}
        <div style={{
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
        }}>
          <span>{zone.environment === 'indoor' ? '🏠' : '🌳'}</span>
          <span>Vue Découpée : {zone.name}</span>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        gap: 6
      }}>
        <button
          onClick={() => toggleLayer('aiZones')}
          aria-pressed={showZoneUi}
          title={showZoneUi ? 'Masquer les marqueurs des zones IA' : 'Afficher les marqueurs des zones IA'}
          style={{
            background: showZoneUi ? 'rgba(8, 145, 178, 0.95)' : 'rgba(15, 23, 42, 0.65)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🤖 {showZoneUi ? 'Masquer zones IA' : 'Afficher zones IA'}
        </button>
        <button
          onClick={() => setShowFpsGraph(v => !v)}
          style={{
            background: showFpsGraph ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.65)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📊 {showFpsGraph ? 'Masquer FPS' : 'Afficher FPS'}
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
        Clic gauche : rotation • Molette : zoom • Clic droit : translation
      </div>
    </div>
  );
}
