import { memo, useState, useMemo, useEffect, useRef, useLayoutEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { SpatialZone } from '@features/scene/ai/SpatialZone';
import { drawFps } from '@features/scene/DevToolsOverlay';
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
  const waypoints = useMemo(() => zone.getWaypoints(), [zone]);

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

      {/* ── Marqueurs Waypoints de la pièce ── */}
      {showZoneUi && waypoints.map(wp => (
        <group key={wp.id} position={[wp.x, 2, wp.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[6, 8, 24]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} />
          </mesh>
          <Html position={[0, 10, 0]} center transform={false} sprite>
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

function SpatialZoneFpsCollector({ onFps }: { onFps: (fps: number) => void }) {
  const lastTime = useRef(performance.now());
  useFrame(() => {
    const now = performance.now();
    const dt = now - lastTime.current;
    lastTime.current = now;
    if (dt > 0 && dt < 2000) {
      const fps = Math.round(1000 / dt);
      onFps(fps);
    }
  });
  return null;
}

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
  const activeCameraView = useSceneStore(s => s.activeCameraView);

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
    const direction = new THREE.Vector3(...(CAMERA_VIEW_DIRECTIONS[activeCameraView ?? 'iso-se'] ?? [1, 1, 1])).normalize();
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
      target={[centerX, centerY, centerZ]}
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

  const [showFpsGraph, setShowFpsGraph] = useState(true);
  const showZoneUi = useSceneStore(state => state.layers.aiZones);
  const toggleLayer = useSceneStore(state => state.toggleLayer);
  const [fpsSamples, setFpsSamples] = useState<number[]>([]);
  const [currentFps, setCurrentFps] = useState<number>(60);
  const fpsCanvasRef = useRef<HTMLCanvasElement>(null);
  const samplesRef = useRef<number[]>([]);
  const lastFpsDrawRef = useRef<number>(0);
  const lastReactUpdateRef = useRef<number>(0);

  const camPosition: [number, number, number] = [
    centerX + camDistance * 0.75, centerY + camDistance * 0.7, centerZ + camDistance * 0.75,
  ];

  const handleFps = (fps: number) => {
    const s = samplesRef.current;
    s.push(fps);
    if (s.length > 80) s.shift();
    const now = performance.now();

    // Match DevToolsCollector: collect every frame, redraw the graph at 10 Hz.
    if (fpsCanvasRef.current && now - lastFpsDrawRef.current > 100) {
      lastFpsDrawRef.current = now;
      drawFps(fpsCanvasRef.current, s);
    }

    // Match DevToolsCollector's 4 Hz React update cadence for the FPS labels.
    if (now - lastReactUpdateRef.current > 250) {
      lastReactUpdateRef.current = now;
      setCurrentFps(fps);
      setFpsSamples([...s]);
    }
  };

  const valid = fpsSamples.filter(v => v > 0);
  const fpsMin = valid.length ? Math.min(...valid) : 0;
  const fpsMax = valid.length ? Math.max(...valid) : 0;
  const fpsColor = currentFps >= 50 ? '#16a34a' : currentFps >= 30 ? '#d97706' : '#dc2626';

  const [liveStats, setLiveStats] = useState<{ triangles: number; drawCalls: number } | null>(null);

  const handleStats = (s: { triangles: number; drawCalls: number }) => {
    setLiveStats(s);
    onStats?.(s);
  };

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
          <MemoizedStudioCroppedScene zone={zone} />
        </Suspense>

        <SpatialZoneFpsCollector onFps={handleFps} />
        <SpatialZoneStatsCollector onStats={handleStats} />

        <PreviewCameraController
          centerX={centerX}
          centerY={centerY}
          centerZ={centerZ}
          camDistance={camDistance}
          zoneSize={maxDim}
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
            backdropFilter: 'blur(4px)'
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
            backdropFilter: 'blur(4px)'
          }}
        >
          📊 {showFpsGraph ? 'Masquer FPS' : 'Afficher FPS'}
        </button>
      </div>

      {/* Frame Rate Graph Overlay & Triangles/Draw Calls */}
      {showFpsGraph && (
        <div style={{
          position: 'absolute',
          bottom: 28,
          left: 10,
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          padding: '6px 8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
            <span style={{ color: fpsColor, fontWeight: 700 }}>{currentFps} FPS</span>
            <span style={{ color: '#94a3b8', fontSize: 9 }}>min:{fpsMin} max:{fpsMax}</span>
          </div>
          <canvas
            ref={fpsCanvasRef}
            width={140}
            height={46}
            style={{ display: 'block', borderRadius: 4 }}
          />
          {liveStats && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 9,
              color: '#cbd5e1',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: 3,
              marginTop: 1,
              fontFamily: 'monospace'
            }}>
              <span>📐 {liveStats.triangles.toLocaleString()} tris</span>
              <span style={{ color: liveStats.drawCalls > 80 ? '#f87171' : '#4ade80' }}>
                ⚡ {liveStats.drawCalls} calls
              </span>
            </div>
          )}
        </div>
      )}

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
