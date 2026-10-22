import { SmartActionPreview } from './SmartActionPreview';
import type { SmartActionPreviewRequest } from './InventorySmartActions';
import type { SceneItemProps } from '@shared/types';
import { useState, useRef, useLayoutEffect, useCallback, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html, Line, Grid, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { OrbitControls } from '@features/scene/camera/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { type InventoryItem, type StorageSpace, WIGS_ITEMS } from './inventoryData';
import { SCENE_REGISTRY } from './previewRegistry';
import { getActionDef, getPreviewActionIds, getActionLabel, toggleObjectAction } from '@features/scene/objectActionRegistry';
import { GlobalSkeletonHelpers } from '@features/scene/utils/GlobalSkeletonHelpers';
import { GroundPoint } from '@features/scene/character/GroundPoint';
import { SkeletonHierarchyPanel } from '@features/scene/utils/SkeletonHierarchyPanel';
import type { SkeletonGroup } from '@features/scene/utils/skeletonTypes';
import { WALKER_ANIM_OPTIONS } from '@features/scene/animOptions';
import { resolveAnimationId } from '@features/scene/animations/animationResolver';
import { resolveDuoPreviewParticipants, type DuoAnimationDef } from '@features/scene/animations/duoAnimations';
import { CHARACTERS, isExtraCharacter } from '@features/scene/characterConfig';
import { SkySphere } from '@features/scene/SkySphere';
import { useAnimPreviewStore } from './useAnimPreviewStore';
import { AnimFrameController } from './AnimFrameController';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { CharacterSection } from '@features/scene/sidepanel/sections/CharacterSection';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { DevToolsCollector } from '@features/scene/DevToolsCollector';
import { ViewControlBar } from '@features/scene/ViewControlBar';
import { resolveCameraView } from '@features/scene/camera/cameraViews';
import { getOrbitMouseButtons, getOrbitTouches } from '@features/scene/camera/orbitMouseButtons';
import { TOOLBAR_BUTTON_CLASS } from '@features/scene/toolbarStyles';
import { useIsMobile } from '@shared/hooks/useIsMobile';

function disposePreviewScene(root: THREE.Object3D) {
  root.traverse((node: any) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material: THREE.Material | undefined) => {
      if (!material) return;
      Object.values(material).forEach((value: any) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

export interface GlbDebugStats {
  fileSize?: number;
  triangles: number;
  drawCalls: number;
}

const glbSizeCache = new Map<string, number>();
type PreviewCameraView = 'free' | string;

const PREVIEW_VIEW_LABELS: Record<string, string> = {
  north: 'Nord (Arrière)',
  'north-east': 'Nord-Est',
  east: 'Est (Profil Droit)',
  'south-east': 'Sud-Est',
  south: 'Sud (Face)',
  'south-west': 'Sud-Ouest',
  west: 'Ouest (Profil Gauche)',
  'north-west': 'Nord-Ouest',
  top: 'Dessus',
  bottom: 'Dessous',
};

function getPreviewViewConfig(key: string, elevation = 45): { direction: THREE.Vector3; up: [number, number, number] } {
  try {
    const view = resolveCameraView(key, 'persp', undefined, elevation);
    const direction = new THREE.Vector3(
      view.pos[0] - view.target[0],
      view.pos[1] - view.target[1],
      view.pos[2] - view.target[2]
    ).normalize();
    return { direction, up: [0, 1, 0] };
  } catch {
    return { direction: new THREE.Vector3(1, 1, 1).normalize(), up: [0, 1, 0] };
  }
}

function GlbScene({ glbPath, onSize, onStats }: { glbPath: string; onSize?: () => void; onStats?: (s: GlbDebugStats) => void }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  useEffect(() => {
    const draco = new DRACOLoader(); draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    let cancelled = false;

    // Fetch file size if not cached
    if (glbPath) {
      if (glbSizeCache.has(glbPath)) {
        // already cached
      } else {
        fetch(glbPath, { method: 'HEAD' })
          .then(res => {
            const len = res.headers.get('content-length');
            if (len) {
              const sz = parseInt(len, 10);
              if (!isNaN(sz)) glbSizeCache.set(glbPath, sz);
            }
          })
          .catch(() => {});
      }
    }

    loader.load(glbPath, gltf => {
      if (cancelled) {
        disposePreviewScene(gltf.scene);
      } else {
        // Normaliser l'échelle si le modèle est en mètres (IKEA models < 5 unités de haut/large)
        const rawBox = new THREE.Box3().setFromObject(gltf.scene);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        if (maxDim > 0 && maxDim < 5) {
          gltf.scene.scale.setScalar(100);
        }

        setScene(gltf.scene);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(gltf.scene);
          gltf.animations.forEach(clip => {
            mixer.clipAction(clip).play();
          });
          mixerRef.current = mixer;
        }

        // Compute geometry stats
        let tris = 0;
        let meshes = 0;
        gltf.scene.traverse((node: any) => {
          if (node.isMesh && node.geometry) {
            meshes++;
            const geom = node.geometry as THREE.BufferGeometry;
            if (geom.index) {
              tris += geom.index.count / 3;
            } else if (geom.attributes?.position) {
              tris += geom.attributes.position.count / 3;
            }
          }
        });
        const sz = glbSizeCache.get(glbPath);
        onStats?.({
          fileSize: sz,
          triangles: Math.round(tris),
          drawCalls: meshes,
        });
      }
    }, undefined, () => undefined);
    return () => {
      cancelled = true;
      draco.dispose();
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      setScene(previous => {
        if (previous) disposePreviewScene(previous);
        return null;
      });
    };
  }, [glbPath, onStats]);

  useLayoutEffect(() => {
    if (scene) onSize?.();
  }, [scene, onSize]);

  if (!scene) return null;
  return <primitive object={scene} dispose={null} />;
}

function Dimensions({ dims, worldSize, grounded = false }: { dims: { w: number, d: number, h: number }; worldSize: { x: number; y: number; z: number }; grounded?: boolean; }) {
  const hx = worldSize.x / 2, hy = worldSize.y / 2, hz = worldSize.z / 2, off = Math.max(5, Math.min(worldSize.x, worldSize.z) * 0.1), LC = '#0058a3';
  const pill: React.CSSProperties = { background: 'rgba(255, 255, 255, 0.4)', padding: '2px 5px', color: LC, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', borderRadius: 3 };

  const axes = useMemo(() => {
    const h = new THREE.AxesHelper(Math.max(20, Math.max(worldSize.x, worldSize.y, worldSize.z) * 0.25));
    h.renderOrder = 999; (h.material as THREE.Material).depthTest = false;
    return h;
  }, [worldSize.x, worldSize.y, worldSize.z]);

  const groupY = grounded ? 0 : -hy;

  return (
    <group position={[0, groupY, 0]}>
      <primitive object={axes} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2, 32]} />
        <meshBasicMaterial color={LC} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Height */}
      <Line points={[[hx + off, 0, hz], [hx + off, hy * 2, hz]]} color={LC} lineWidth={1.5} />
      <Html position={[hx + off, hy, hz]} center distanceFactor={150}><div style={pill}>{dims.h} cm</div></Html>

      {/* Width */}
      <Line points={[[-hx, 0, hz], [-hx, -off, hz + off]]} color={LC} lineWidth={1.5} />
      <Line points={[[ hx, 0, hz], [ hx, -off, hz + off]]} color={LC} lineWidth={1.5} />
      <Line points={[[-hx, -off, hz + off], [hx, -off, hz + off]]} color={LC} lineWidth={1.5} />
      <Html position={[0, -off, hz + off]} center distanceFactor={150}><div style={pill}>{dims.w} cm</div></Html>

      {/* Depth */}
      <Line points={[[hx, 0, -hz], [hx + off, 0, -hz - off]]} color={LC} lineWidth={1.5} />
      <Line points={[[hx, 0,  hz], [hx + off, 0,  hz + off]]} color={LC} lineWidth={1.5} />
      <Line points={[[hx + off, 0, -hz - off], [hx + off, 0, hz + off]]} color={LC} lineWidth={1.5} />
      <Html position={[hx + off, 0, 0]} center distanceFactor={150} rotation={[0, Math.PI / 2, 0]}><div style={pill}>{dims.d} cm</div></Html>
    </group>
  );
}

function PreviewEnvironment({ showGrid, neutralLighting }: { showGrid: boolean; neutralLighting: boolean }) {
  const neutralBackground = useMemo(() => new THREE.Color('#d2d2d2'), []);
  const { scene } = useThree();
  useLayoutEffect(() => { if (neutralLighting) scene.environment = null; }, [scene, neutralLighting]);

  useFrame(({ scene }) => {
    scene.background = neutralBackground;
  });

  return neutralLighting ? null : <SkySphere envOnly={showGrid} showSpaceBackdrop={false} />;
}

function FitCamera({ target = [0, 0, 0], boundsRadius }: { target?: [number, number, number]; boundsRadius?: number }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.layers.enableAll();
    if ((camera as any).isPerspectiveCamera && boundsRadius && boundsRadius > 0) {
      const perspCam = camera as THREE.PerspectiveCamera;
      const fovRad = (perspCam.fov * Math.PI) / 180;
      // Distance idéale pour englober l'objet avec une marge de respiration de 30%
      const dist = (boundsRadius / Math.sin(fovRad / 2)) * 1.15;
      camera.position.set(dist * 0.75, target[1] + dist * 0.45, dist * 0.95);
      camera.near = Math.max(0.5, dist / 100);
      camera.far = Math.max(10000, dist * 20);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(new THREE.Vector3(...target));
  }, [camera, target, boundsRadius]);
  return null;
}

function OrthoCameraControls({
  mode,
  target = [0, 0, 0],
  boundsRadius = 50,
}: {
  mode: PreviewCameraView;
  target?: [number, number, number];
  boundsRadius?: number;
}) {
  const { size, camera } = useThree();
  const orbitMouseMode = useSceneStore(state => state.orbitMouseMode);
  const cameraElevation = useSceneStore(state => state.cameraElevation ?? 45);
  const aspect = size.width / Math.max(1, size.height);
  const ctrlRef = useRef<any>(null);
  const camRef = useRef<THREE.OrthographicCamera>(null);

  const viewH = useMemo(() => {
    return Math.max(80, (boundsRadius || 50) * 2.2);
  }, [boundsRadius]);

  const viewW = viewH * aspect;

  const camTarget: [number, number, number] = useMemo(() => {
    if (mode === 'free') return target;
    if (mode === 'top' || mode === 'bottom') {
      return [0, 0, 0];
    }
    return [0, target[1] || 85, 0];
  }, [mode, target]);

  const { direction, up } = useMemo(() => {
    if (mode === 'free') return { direction: new THREE.Vector3(0.75, 0.45, 0.95).normalize(), up: [0, 1, 0] as [number, number, number] };
    return getPreviewViewConfig(mode, cameraElevation);
  }, [mode, cameraElevation]);

  const camPos: [number, number, number] = useMemo(() => {
    if (mode === 'free') {
      const distance = Math.max(100, boundsRadius * 3.2);
      return [target[0] + distance * 0.75, target[1] + distance * 0.45, target[2] + distance * 0.95];
    }
    return [
      camTarget[0] + direction.x * 1000,
      camTarget[1] + direction.y * 1000,
      camTarget[2] + direction.z * 1000,
    ];
  }, [mode, camTarget, boundsRadius, target, direction]);

  useLayoutEffect(() => {
    camera.layers.enableAll();
    if (camRef.current) {
      camRef.current.layers.enableAll();
      camRef.current.left = -viewW / 2;
      camRef.current.right = viewW / 2;
      camRef.current.top = viewH / 2;
      camRef.current.bottom = -viewH / 2;
      camRef.current.up.set(...up);
      camRef.current.position.set(camPos[0], camPos[1], camPos[2]);
      camRef.current.lookAt(camTarget[0], camTarget[1], camTarget[2]);
      camRef.current.updateProjectionMatrix();
    }
  }, [camera, mode, camPos, camTarget, viewW, viewH, up]);

  useEffect(() => {
    if (ctrlRef.current) {
      ctrlRef.current.target.set(camTarget[0], camTarget[1], camTarget[2]);
      ctrlRef.current.update();
    }
  }, [camTarget]);

  return (
    <>
      <OrthographicCamera
        ref={camRef}
        makeDefault
        manual
        position={camPos}
        left={-viewW / 2}
        right={viewW / 2}
        top={viewH / 2}
        bottom={-viewH / 2}
        near={1}
        far={10000}
      />
      <OrbitControls
        ref={ctrlRef}
        makeDefault
        mouseButtons={getOrbitMouseButtons(orbitMouseMode)}
        touches={getOrbitTouches(orbitMouseMode)}
        target={camTarget}
        enablePan={true}
        enableZoom={true}
        screenSpacePanning={true}
        minZoom={0.2}
        maxZoom={50}
      />
    </>
  );
}

function PerspectivePresetControls({
  mode,
  target = [0, 0, 0],
  boundsRadius = 50,
}: {
  mode: PreviewCameraView;
  target?: [number, number, number];
  boundsRadius?: number;
}) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const orbitMouseMode = useSceneStore(state => state.orbitMouseMode);
  const cameraElevation = useSceneStore(state => state.cameraElevation ?? 45);
  const ctrlRef = useRef<any>(null);
  const camTarget = useMemo<[number, number, number]>(() => (
    mode === 'top' || mode === 'bottom' ? [0, 0, 0] : [0, target[1] || 85, 0]
  ), [mode, target]);
  const distance = Math.max(100, (boundsRadius || 50) * 3.2);
  const { direction, up } = useMemo(() => getPreviewViewConfig(mode, cameraElevation), [mode, cameraElevation]);
  const position = useMemo<[number, number, number]>(() => [
    camTarget[0] + direction.x * distance,
    camTarget[1] + direction.y * distance,
    camTarget[2] + direction.z * distance,
  ], [camTarget, direction, distance]);

  useLayoutEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.layers.enableAll();
    camera.up.set(...up);
    camera.position.set(...position);
    camera.lookAt(...camTarget);
    camera.updateProjectionMatrix();
    if (ctrlRef.current) {
      ctrlRef.current.target.set(...camTarget);
      ctrlRef.current.update();
    }
  }, [camTarget, position, up]);

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={45} near={0.5} far={10000} position={position} />
      <OrbitControls ref={ctrlRef} makeDefault mouseButtons={getOrbitMouseButtons(orbitMouseMode)} touches={getOrbitTouches(orbitMouseMode)} target={camTarget} enablePan enableZoom screenSpacePanning minDistance={2} maxDistance={2500} />
    </>
  );
}

function GroundDatumLines({ mode }: { mode: string }) {
  const span = 150;

  if (mode === 'top') {
    return (
      <group position={[0, 0.05, 0]}>
        {/* Axe latéral X (Alignement T-Pose des bras : Vert) */}
        <Line points={[[-span, 0, 0], [span, 0, 0]]} color="#00ff66" lineWidth={2} />
        {/* Axe antéro-postérieur Z (Axe de regard / marche : Bleu) */}
        <Line points={[[0, 0, -span], [0, 0, span]]} color="#0088ff" lineWidth={2} />
        {/* Lignes de repère latérales ±10 cm */}
        <Line points={[[-span, 0, 10], [span, 0, 10]]} color="#ffbb00" lineWidth={1} dashed dashSize={2} gapSize={1} />
        <Line points={[[-span, 0, -10], [span, 0, -10]]} color="#ffbb00" lineWidth={1} dashed dashSize={2} gapSize={1} />
      </group>
    );
  }

  const isSide = mode === 'west' || mode === 'east';

  const linePoints = (y: number): [[number, number, number], [number, number, number]] => {
    if (isSide) {
      return [[0, y, -span], [0, y, span]];
    }
    return [[-span, y, 0], [span, y, 0]];
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Ligne de sol principale Y = 0 (Vert fluo haute visibilité) */}
      <Line points={linePoints(0)} color="#00ff66" lineWidth={2.5} />
      <Line points={linePoints(0.01)} color="#00ff66" lineWidth={1.5} />

      {/* Ligne de tolérance +2 cm (Jaune) */}
      <Line points={linePoints(2)} color="#ffbb00" lineWidth={1} dashed dashSize={2} gapSize={1} />

      {/* Ligne de tolérance -2 cm (Rouge) */}
      <Line points={linePoints(-2)} color="#ff4444" lineWidth={1} dashed dashSize={2} gapSize={1} />
    </group>
  );
}

function CenteredItem({ Component, actionState, item, grounded = false, preserveOriginXZ = false, showDims = false, wireframe = false, glbPath, onTargetChange, onBoundsChange, onStats }: { Component?: any; actionState: Record<string, any>; item: PreviewTarget; grounded?: boolean; preserveOriginXZ?: boolean; showDims?: boolean; wireframe?: boolean; glbPath?: string; onTargetChange?: (t: [number, number, number]) => void; onBoundsChange?: (radius: number) => void; onStats?: (s: GlbDebugStats) => void; }) {
  const PreviewComponent = useMemo(() => Component ?? function GlbPreview({ onSize }: SceneItemProps) {
    return <GlbScene glbPath={glbPath!} onSize={() => onSize(new THREE.Vector3())} onStats={onStats} />;
  }, [Component, glbPath, onStats]);
  const outerRef = useRef<THREE.Group>(null!), innerRef = useRef<THREE.Group>(null!);
  const [worldSize, setWorldSize] = useState<{ x: number; y: number; z: number } | null>(null);
  const lastTargetYRef = useRef<number | null>(null);
  const lastRadiusRef = useRef<number | null>(null);
  const lastStatsRef = useRef<{ sz?: number; tris: number; calls: number } | null>(null);

  const applyWireframe = useCallback(() => {
    if (!innerRef.current) return;
    const targetWireframe = Boolean(wireframe);
    innerRef.current.traverse(node => {
      if (!(node as THREE.Mesh).isMesh) return;
      const mesh = node as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => {
        if (!material || !('wireframe' in material)) return;
        const mat = material as THREE.Material & { wireframe: boolean };
        if (mat.wireframe !== targetWireframe) {
          mat.wireframe = targetWireframe;
          mat.needsUpdate = true;
        }
      });
    });
  }, [wireframe]);

  useLayoutEffect(applyWireframe, [applyWireframe, actionState, item]);
  useFrame(applyWireframe);
  useLayoutEffect(() => () => {
    if (!innerRef.current) return;
    innerRef.current.traverse(node => {
      if (!(node as THREE.Mesh).isMesh) return;
      const mesh = node as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => {
        if (material && 'wireframe' in material) {
          (material as THREE.Material & { wireframe: boolean }).wireframe = false;
        }
      });
    });
  }, []);

  const fit = useCallback(() => {
    if (!outerRef.current || !innerRef.current) return;
    applyWireframe();
    outerRef.current.scale.set(1, 1, 1); outerRef.current.position.set(0, 0, 0); outerRef.current.updateMatrixWorld(true);

    const box = new THREE.Box3();
    let totalTris = 0;
    let totalMeshes = 0;
    innerRef.current.traverse(o => {
      if ((o as THREE.Mesh).isMesh && o.visible) {
        let p: THREE.Object3D | null = o;
        let isVis = true;
        while (p && p !== innerRef.current) {
          if (!p.visible || p.type.includes('Helper') || p.name === 'GroundPoint') {
            isVis = false;
            break;
          }
          p = p.parent;
        }
        if (isVis) {
          const mesh = o as THREE.Mesh;
          totalMeshes++;
          if (mesh.geometry) {
            if (mesh.geometry.index) {
              totalTris += mesh.geometry.index.count / 3;
            } else if (mesh.geometry.attributes?.position) {
              totalTris += mesh.geometry.attributes.position.count / 3;
            }
          }
          const meshBox = new THREE.Box3().setFromObject(o);
          if (!meshBox.isEmpty()) {
            box.union(meshBox);
          }
        }
      }
    });

    if (totalMeshes > 0 && onStats) {
      const sz = glbPath ? glbSizeCache.get(glbPath) : undefined;
      const tris = Math.round(totalTris);
      if (
        !lastStatsRef.current ||
        lastStatsRef.current.sz !== sz ||
        lastStatsRef.current.tris !== tris ||
        lastStatsRef.current.calls !== totalMeshes
      ) {
        lastStatsRef.current = { sz, tris, calls: totalMeshes };
        onStats({
          fileSize: sz,
          triangles: tris,
          drawCalls: totalMeshes,
        });
      }
    }

    if (box.isEmpty()) return;

    // Dimensions réelles en cm (1 unité = 1 cm)
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    setWorldSize(prev => {
      if (
        prev &&
        Math.abs(prev.x - size.x) < 0.01 &&
        Math.abs(prev.y - size.y) < 0.01 &&
        Math.abs(prev.z - size.z) < 0.01
      ) {
        return prev;
      }
      return { x: size.x, y: size.y, z: size.z };
    });

    // Offset outer group to center the item in X/Z
    const px = preserveOriginXZ ? 0 : -center.x;
    const pz = preserveOriginXZ ? 0 : -center.z;

    if (grounded) {
      // Positionne le root pour que le point le plus bas du modèle (les semelles) soit exactement à Y=0
      outerRef.current.position.set(px, -box.min.y, pz);
    } else {
      // Center vertically in view
      outerRef.current.position.set(px, -center.y, pz);
    }

    const isWigCategory = Boolean(item && 'category' in item && (item as any).category === 'wigs');
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const newRadius = Math.max(12, sphere.radius * (isWigCategory ? 0.62 : 1));
    if (lastRadiusRef.current === null || Math.abs(lastRadiusRef.current - newRadius) > 0.5) {
      lastRadiusRef.current = newRadius;
      onBoundsChange?.(newRadius);
    }

    if (onTargetChange) {
      const targetY = grounded ? (isWigCategory ? size.y * 0.58 : size.y / 2) : 0;
      if (lastTargetYRef.current === null || Math.abs(lastTargetYRef.current - targetY) > 0.1) {
        lastTargetYRef.current = targetY;
        onTargetChange([0, targetY, 0]);
      }
    }
  }, [grounded, preserveOriginXZ, onTargetChange, onBoundsChange, onStats, glbPath, applyWireframe, item]);

  useLayoutEffect(() => {
    lastStatsRef.current = null;
    lastRadiusRef.current = null;
    lastTargetYRef.current = null;

    // If glbPath is present, trigger size fetch
    if (glbPath && !glbSizeCache.has(glbPath)) {
      fetch(glbPath, { method: 'HEAD' })
        .then(res => {
          const len = res.headers.get('content-length');
          if (len) {
            const sz = parseInt(len, 10);
            if (!isNaN(sz)) {
              glbSizeCache.set(glbPath, sz);
              fit();
            }
          }
        })
        .catch(() => {});
    }

    // Retries to ensure async GLTF / cloned components (like Variera) compute matrices & meshes
    fit();
    const t1 = setTimeout(fit, 60);
    const t2 = setTimeout(fit, 250);
    const t3 = setTimeout(fit, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [fit, item?.id, glbPath]);

  return (
    <group>
      <group ref={outerRef}>
        <group ref={innerRef}>
          {actionState.smartAction
            ? <SmartActionPreview key={actionState.smartAction.runId} Component={PreviewComponent} item={item ?? {} as any} isPreview actionState={actionState} onSize={fit} request={actionState.smartAction} />
            : <PreviewComponent item={item ?? {} as any} isPreview actionState={actionState} onSize={fit} />}
        </group>
      </group>
      {showDims && item?.dims && worldSize && <Dimensions dims={item.dims} worldSize={worldSize} grounded={grounded} />}
    </group>
  );
}

function RegistryScene({ item, actionState, showDims, wireframe, onTargetChange, onBoundsChange, onStats }: { item: InventoryItem; actionState: Record<string, any>; showDims: boolean; wireframe: boolean; onTargetChange?: (t: [number, number, number]) => void; onBoundsChange?: (r: number) => void; onStats?: (s: GlbDebugStats) => void; }) {
  const Component = SCENE_REGISTRY[item.id], isCharacter = item.category === 'characters';
  return (
    <>
      <CenteredItem Component={Component} actionState={actionState} item={item} grounded={true} preserveOriginXZ={isCharacter} showDims={showDims} wireframe={wireframe} glbPath={item.glbPath} onTargetChange={onTargetChange} onBoundsChange={onBoundsChange} onStats={onStats} />
      {!isCharacter && <GroundPoint />}
    </>
  );
}

function PhotoGallery({ photos, initialIndex = 0, onIndexChange }: { photos: string[], initialIndex?: number, onIndexChange?: (i: number) => void }) {
  const [idx, setIdx] = useState(initialIndex);
  useEffect(() => {
    setIdx(initialIndex);
  }, [initialIndex]);

  const handleNext = () => {
    const next = (idx + 1) % photos.length;
    setIdx(next);
    onIndexChange?.(next);
  };
  const handlePrev = () => {
    const prev = (idx - 1 + photos.length) % photos.length;
    setIdx(prev);
    onIndexChange?.(prev);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={photos[idx]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
      {photos.length > 1 && (
        <>
          <button onClick={handlePrev} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', padding: '6px 9px', fontSize: 16, lineHeight: 1 }}>‹</button>
          <button onClick={handleNext} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', padding: '6px 9px', fontSize: 16, lineHeight: 1 }}>›</button>
          <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#666', pointerEvents: 'none' }}>{idx + 1} / {photos.length}</div>
        </>
      )}
    </div>
  );
}

type PreviewTarget = InventoryItem | StorageSpace | null;


export function InventoryPreview({
  item,
  width = '100%',
  height = '100%',
  hideFooter = false,
  initialDuoAnim,
  initialDuoPartner,
  initialAnim,
  hideAnimFrameController = false,
  hideViewControlBar = false,
  showPhotoGallery = true,
  defaultShowGrid = false,
  neutralLighting = false,
  defaultAutoRotate = true,
  defaultShowMiniPerf,
  preserveStateOnItemChange = false,
  externalHairColor,
  externalLaraVariant,
  onGlbStats,
  smartAction,
}: {
  item: PreviewTarget;
  smartAction?: SmartActionPreviewRequest;
  width?: string | number;
  height?: string | number;
  hideFooter?: boolean;
  initialDuoAnim?: DuoAnimationDef;
  initialDuoPartner?: string;
  initialAnim?: string;
  hideAnimFrameController?: boolean;
  hideViewControlBar?: boolean;
  showPhotoGallery?: boolean;
  defaultShowGrid?: boolean;
  neutralLighting?: boolean;
  defaultAutoRotate?: boolean;
  defaultShowMiniPerf?: boolean;
  preserveStateOnItemChange?: boolean;
  externalHairColor?: string;
  externalLaraVariant?: string;
  onGlbStats?: (s: GlbDebugStats | null) => void;
}) {
  const isMobile = useIsMobile();
  const [showMiniPerf, setShowMiniPerf] = useState(() => defaultShowMiniPerf !== undefined ? defaultShowMiniPerf : !isMobile);
  const glbPath = item && 'glbPath' in item ? item.glbPath : undefined, photos = item && 'photos' in item ? (item as InventoryItem).photos : undefined;
  const hasRegistry = item ? !!SCENE_REGISTRY[item.id] : false, has3D = !!glbPath || hasRegistry, hasPhotos = showPhotoGallery && !!photos && photos.length > 0;
  const actionKeys = item && (!('category' in item && item.category === 'characters') || ['unitree-g1', 'unitree-go2', 'jumper-robot'].includes(item.id))
    ? getPreviewActionIds(item.id)
    : [];
  const [actionStates, setActionStates] = useState<Record<string, any>>({}), [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d'), [showDims, setShowDims] = useState(false), [autoRotate, setAutoRotate] = useState(defaultAutoRotate);
  const [target, setTarget] = useState<[number, number, number]>([0, 0, 0]);
  const [boundsRadius, setBoundsRadius] = useState<number>(50);
  const initialFraming = useRef<{ target?: [number, number, number]; radius?: number }>({});
  const handleTargetChange = useCallback((next: [number, number, number]) => {
    if (preserveStateOnItemChange && initialFraming.current.target) return;
    initialFraming.current.target = next;
    setTarget(next);
  }, [preserveStateOnItemChange]);
  const handleBoundsChange = useCallback((next: number) => {
    if (preserveStateOnItemChange && initialFraming.current.radius !== undefined) return;
    initialFraming.current.radius = next;
    setBoundsRadius(next);
  }, [preserveStateOnItemChange]);
  const [showGrid, setShowGrid] = useState(defaultShowGrid);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [previewView, setPreviewView] = useState<PreviewCameraView>('free');
  const cameraProjection = useSceneStore(state => state.cameraProjection);
  const orbitMouseMode = useSceneStore(state => state.orbitMouseMode);
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const layers = useSceneStore(state => state.layers);
  const toggleLayer = useSceneStore(state => state.toggleLayer);
  const wireframe = !!layers.wireframe;
  const setWireframe = useCallback((updater: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof updater === 'function' ? updater(!!useSceneStore.getState().layers.wireframe) : updater;
    if (next !== !!useSceneStore.getState().layers.wireframe) {
      toggleLayer('wireframe');
    }
  }, [toggleLayer]);

  const [showPnjPanel, setShowPnjPanel] = useState<boolean>(false);
  const [selectedBoneName, setSelectedBoneName] = useState<string | null>(null);
  const [skeletonGroups, setSkeletonGroups] = useState<SkeletonGroup[]>([]);
  const [showBoneTree, setShowBoneTree] = useState<boolean>(false);
  const [simulateMotion, setSimulateMotion] = useState<boolean>(true);
  const [globalHaircut, setGlobalHaircut] = useState<string>('original');
  const [globalHairColor, setGlobalHairColor] = useState<string>('rose');
  const lastWigRef = useRef<string>('hair_101');
  const lastSoloAnimRef = useRef<string>('idle');

  const handleRandomHairColor = () => {
    const allColors = ['rose', 'naturel', 'noir', 'brun', 'chatain', 'blond', 'roux', 'rouge', 'bleu', 'vert', 'violet', 'arc-en-ciel'];
    const otherColors = allColors.filter(c => c !== globalHairColor);
    const newColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    setGlobalHairColor(newColor);
    setActionStates(s => ({ ...s, previewHairColor: newColor }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: newColor } }));
  };

  const handleRandomHaircut = () => {
    const allHaircuts = ['original', ...WIGS_ITEMS.map(w => w.id)];
    const otherHaircuts = allHaircuts.filter(h => h !== globalHaircut);
    const newHaircut = otherHaircuts[Math.floor(Math.random() * otherHaircuts.length)];
    setGlobalHaircut(newHaircut);
    if (newHaircut !== 'original') lastWigRef.current = newHaircut;
    setActionStates(s => ({ ...s, previewHaircut: newHaircut }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: newHaircut } }));
  };

  useEffect(() => {
    if (preserveStateOnItemChange) return;
    setActionStates(initialDuoAnim ? {
      duoAnimDef: initialDuoAnim,
      duoPartnerId: initialDuoPartner || (item?.id === 'native' ? 'rosanna' : 'native'),
    } : {});
    lastSoloAnimRef.current = 'idle';
    setViewMode('3d');
    setAutoRotate(defaultAutoRotate);
    setTarget([0, 0, 0]);
    setBoundsRadius(50);
    setPhotoIdx(0);
    setShowPnjPanel(false);
    setSelectedBoneName(null);
    setSkeletonGroups([]);
    setShowBoneTree(false);
    setPreviewView('free');
    useAnimPreviewStore.getState().reset();
  }, [item?.id, preserveStateOnItemChange]);

  const toggleSkeleton = () => {
    const next = !actionStates.showBones;
    if (!next) {
      setSelectedBoneName(null);
      setShowBoneTree(false);
    }
    setActionStates(s => ({ ...s, showBones: next }));
  };

  // Map ViewControlBar camera-view events to preview ortho views
  useEffect(() => {
    const onView = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.projection === 'ortho' || detail.projection === 'persp') {
        useSceneStore.getState().setCameraProjection(detail.projection);
      }
      if (detail.key) {
        setPreviewView(detail.key);
        setAutoRotate(false);
      }
    };
    document.addEventListener('camera-view', onView);
    return () => document.removeEventListener('camera-view', onView);
  }, []);

  useEffect(() => {
    if (initialAnim && !initialDuoAnim) {
      setActionStates(s => ({
        ...s,
        characterAnim: initialAnim,
        duoAnimDef: undefined,
        isPaused: false,
      }));
      useAnimPreviewStore.getState().play();
    }
  }, [initialAnim, initialDuoAnim]);

  useEffect(() => {
    if (initialDuoAnim) {
      setActionStates(s => ({
        ...s,
        duoAnimDef: initialDuoAnim,
        duoPartnerId: initialDuoPartner || s.duoPartnerId || (item?.id === 'native' ? 'rosanna' : 'native'),
        characterAnim: undefined,
        isPaused: false
      }));
      useAnimPreviewStore.getState().play();
    }
  }, [initialDuoAnim]);

  useEffect(() => {
    if (initialDuoPartner) setActionStates(s => ({ ...s, duoPartnerId: initialDuoPartner }));
  }, [initialDuoPartner]);

  const duoParticipants = actionStates.duoAnimDef
    ? resolveDuoPreviewParticipants(item?.id, actionStates.duoPartnerId)
    : undefined;
  const baseActionStates = {
    ...actionStates,
    smartAction,
    simulateMotion,
    ...(externalHairColor ? { previewHairColor: externalHairColor } : {}),
    ...(externalLaraVariant ? { previewLaraVariant: externalLaraVariant } : {}),
  };
  const previewActionStates = duoParticipants
    ? { ...baseActionStates, duoPartnerId: duoParticipants.partnerId }
    : baseActionStates;

  const showing3D = has3D && (Boolean(smartAction) || !hasPhotos || viewMode === '3d'), showingPhotos = !smartAction && hasPhotos && (!has3D || viewMode === 'photos');

  const isCharacterItem = showing3D && item && 'category' in item && ((item as any).category === 'characters' || item.id === 'unitree-h2') && !['unitree-g1', 'unitree-go2', 'jumper-robot'].includes(item.id);
  const isHumanCharacter = Boolean(isCharacterItem && !['ushiro', 'shiba-inu', 'ulotte', 'robin-bird', 'jikin-goldfish', 'tosakin-goldfish', 'black-hornet-drone'].includes(item.id));
  const isWigItem = Boolean(showing3D && item && 'category' in item && ((item as any).category === 'wigs'));

  const animalAnimOptions = useMemo(() => {
    if (!item?.id) return undefined;
    if (item.id === 'black-hornet-drone') return [
      { value: 'Drone_Hover', label: 'Vol stationnaire' },
      { value: 'Drone_Fly', label: 'Vol' },
      { value: 'Drone_Scan', label: 'Observation' },
      { value: 'Drone_Landed', label: 'Au sol' },
    ];
    if (item.id === 'ulotte') return getActionDef('ulotte-motion')!.options;
    if (['ushiro', 'shiba-inu'].includes(item.id)) {
      return [
        { value: 'idle', label: 'Idle' },
        { value: 'jump', label: 'Jump' },
        { value: 'run', label: 'Run' },
        { value: 'sitdown', label: 'SitDown' },
        { value: 'walk', label: 'Walk' },
      ];
    }
    if (['jikin-goldfish', 'tosakin-goldfish'].includes(item.id)) {
      return [
        { value: 'idle', label: 'Idle' },
        { value: 'swim', label: 'Swim' },
        { value: 'eat', label: 'Eat' },
        { value: 'turn-left', label: 'Turn Left' },
        { value: 'turn-right', label: 'Turn Right' },
      ];
    }
    if (item.id === 'robin-bird') {
      return [
        { value: 'Robin_Bird_Idle', label: 'Idle' },
        { value: 'Robin_Bird_Idle2', label: 'Idle 2' },
        { value: 'Robin_Bird_Walk', label: 'Walk' },
        { value: 'Robin_Bird_WalkBack', label: 'Walk Back' },
        { value: 'Robin_Bird_Fly', label: 'Fly' },
        { value: 'Robin_Bird_Eat', label: 'Eat' },
        { value: 'Robin_Bird_Eat2', label: 'Eat 2' },
        { value: 'Robin_Bird_Eat3', label: 'Eat 3' },
        { value: 'Robin_Bird_Call', label: 'Call' },
        { value: 'Robin_Bird_Call2', label: 'Call 2' },
        { value: 'Robin_Bird_Hit', label: 'Hit' },
        { value: 'Robin_Bird_Die', label: 'Die' },
      ];
    }
    return undefined;
  }, [item?.id]);

  const datumBannerBottom = 8;
  const currentTargetId = resolveAnimationId(actionStates.characterAnim || 'idle');
  const currentAnimOpt = isHumanCharacter ? WALKER_ANIM_OPTIONS.find(a => a.value === currentTargetId || a.value === actionStates.characterAnim) : null;
  const currentAnimLabel = actionStates.characterAnim === 't-pose'
    ? 'T-Pose'
    : (currentAnimOpt ? currentAnimOpt.label : (actionStates.characterAnim || 'Idle'));

  // Raccourcis clavier dans la preview 3D :
  // 'K' pour afficher / masquer le squelette
  // Les raccourcis d’animation sont gérés uniquement par AnimFrameController.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.isContentEditable)) {
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        toggleSkeleton();
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowMiniPerf(v => !v);
        return;
      }
      if (isWigItem && (e.key === 'm' || e.key === 'M')) {
        setSimulateMotion(v => !v);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionStates.showBones, isWigItem]);

  return (
    <div className="inventory-preview-container" style={{ width }}>
      <div className="inventory-preview-canvas-wrap" style={{ height: height === '100%' ? undefined : height }}>
        {!item && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 12, pointerEvents: 'none' }}>Sélectionner un objet</div>}
      {item && (
        <>
          <div className="position-absolute top-0 start-0 m-2 z-3 d-flex flex-column align-items-start gap-1">
            {showing3D && (
              showMiniPerf ? (
                <div className="inventory-mini-perf glass-card shadow-lg rounded-2 p-1 position-relative" style={{ width: 190 }}>
                  <button
                    type="button"
                    className="btn-close btn-close-white position-absolute top-0 end-0 m-1"
                    style={{ fontSize: '0.6rem', zIndex: 2 }}
                    onClick={() => setShowMiniPerf(false)}
                    title="Masquer les performances (H)"
                    aria-label="Masquer les performances"
                  />
                  <DevToolsGroups Group={({ children }: any) => <>{children}</>} compact headerless />
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-dark bg-opacity-75 border-secondary text-white shadow-sm p-1 d-flex align-items-center justify-content-center"
                  style={{ width: 28, height: 28, borderRadius: 6 }}
                  onClick={() => setShowMiniPerf(true)}
                  title="Afficher les performances (H)"
                  aria-label="Afficher les performances"
                >
                  <i className="bi bi-bar-chart-fill" style={{ fontSize: 13 }} aria-hidden="true" />
                </button>
              )
            )}
          {/* Menu Arbre des os & Influence heatmap */}
          {showing3D && actionStates.showBones && (showBoneTree || selectedBoneName) && (
            <div
              className="d-flex flex-column gap-2"
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              onWheel={e => e.stopPropagation()}
            >
              {selectedBoneName && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(15, 23, 42, 0.92)', border: '1.5px solid #e63946', padding: '6px 8px', borderRadius: 6, maxWidth: 280, boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                    <span className="text-truncate">
                      🎨 Influence : <span style={{ fontFamily: 'monospace', color: '#fffa65', textDecoration: 'underline' }}>{selectedBoneName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBoneName(null)}
                      style={{ background: 'none', border: 'none', color: '#ff7979', cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1 }}
                      title="Désactiver l'influence de l'os"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Légende Heatmap des couleurs d'influence */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#94a3b8' }}>
                      <span>0.0 (Bleu)</span>
                      <span>0.5 (Vert/Jaune)</span>
                      <span>1.0 (Rouge)</span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: 'linear-gradient(to right, rgb(15,25,76) 0%, rgb(0,217,242) 25%, rgb(0,247,0) 50%, rgb(242,247,0) 75%, rgb(255,0,0) 100%)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                      title="Bleu = 0% | Jaune = ~75% | Rouge = 100% (le maillage suit l'os à 100%)"
                    />
                    <div style={{ fontSize: 8, color: '#cbd5e1', textAlign: 'center', opacity: 0.9 }}>
                      Rouge: 100% suit l'os | Bleu: statique (0%)
                    </div>
                  </div>
                </div>
              )}

              {showBoneTree && (
                <SkeletonHierarchyPanel
                  skeletons={skeletonGroups}
                  selectedBoneName={selectedBoneName}
                  onSelectBoneName={setSelectedBoneName}
                  onClose={() => setShowBoneTree(false)}
                />
              )}
            </div>
          )}

          </div>
          {showing3D ? (
            <>
            <Canvas className="inventory-preview-renderer" key={preserveStateOnItemChange ? undefined : item.id} shadows={item.id === 'fridge'} frameloop="always" events={() => ({ enabled: false } as any)} camera={{ fov: 45, near: 0.5, far: 10000, position: [70, 50, 90] }} gl={{ antialias: true, alpha: false, toneMapping: THREE.AgXToneMapping }} onCreated={({ scene, camera, gl }) => { camera.layers.enableAll(); scene.background = new THREE.Color('#d2d2d2'); gl.toneMapping = THREE.AgXToneMapping; }}>
              <PreviewEnvironment showGrid={showGrid} neutralLighting={neutralLighting || Boolean(smartAction)} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[150, 250, 150]} intensity={1.0} />
              <directionalLight position={[-100, 50, -100]} intensity={0.4} color="#aabbff" />
              {cameraProjection === 'ortho' ? (
                <>
                  <OrthoCameraControls mode={previewView} target={target} boundsRadius={boundsRadius} />
              {showGrid && previewView !== 'free' && (previewView === 'north' || previewView === 'south' || previewView === 'east' || previewView === 'west' || previewView === 'top') &&
                <GroundDatumLines mode={previewView} />}
                </>
              ) : (
                <>
                  {previewView === 'free' ? (
                    <>
                      <FitCamera target={target} boundsRadius={boundsRadius} />
                      <OrbitControls mouseButtons={getOrbitMouseButtons(orbitMouseMode)} touches={getOrbitTouches(orbitMouseMode)} autoRotate={autoRotate && !smartAction} autoRotateSpeed={1.2} enablePan enableZoom target={target} onStart={() => setAutoRotate(false)} />
                    </>
                  ) : (
                    <PerspectivePresetControls mode={previewView} target={target} boundsRadius={boundsRadius} />
                  )}
                </>
              )}
              {showGrid && <Grid infiniteGrid fadeDistance={Math.max(800, boundsRadius * 20)} cellColor="#777777" sectionColor="#444444" cellSize={10} sectionSize={50} position={[5, -0.01, 5]} />}
              <Suspense fallback={null}><RegistryScene item={item as InventoryItem} actionState={previewActionStates} showDims={showDims} wireframe={wireframe} onTargetChange={handleTargetChange} onBoundsChange={handleBoundsChange} onStats={onGlbStats} /></Suspense>
              <GlobalSkeletonHelpers
                show={actionStates.showBones}
                selectedBoneName={selectedBoneName}
                onSelectBoneName={setSelectedBoneName}
                onSkeletonGroupsChange={setSkeletonGroups}
              />
              <DevToolsCollector />
            </Canvas>
            </>
          ) : showingPhotos ? <PhotoGallery key={item.id + '-photos'} photos={photos!} initialIndex={photoIdx} onIndexChange={setPhotoIdx} /> : null}
          <div className="position-absolute top-0 end-0 m-2 z-3 d-flex gap-2 align-items-center">
            {showing3D && isWigItem && (
              <button
                type="button"
                onClick={() => setSimulateMotion(v => !v)}
                className={`btn btn-sm ${simulateMotion ? 'btn-success text-white fw-bold' : 'btn-dark bg-opacity-50 border-secondary text-white'} py-1 px-2 small d-flex align-items-center gap-1`}
                style={{ fontSize: 11 }}
                title={simulateMotion ? "Arrêter la simulation de mouvements (M)" : "Simuler le vent et les mouvements des bustes (M)"}
                aria-pressed={simulateMotion}
              >
                <i className={`bi ${simulateMotion ? 'bi-wind' : 'bi-activity'}`} aria-hidden="true" />
                <span>{simulateMotion ? 'Mouvements : Actifs' : 'Simuler mouvements'}</span>
              </button>
            )}
            {showing3D && 'category' in item && ((item as any).category === 'characters' || (item as any).category === 'wigs') && (
              <>
                {actionStates.showBones && (
                  <button
                    type="button"
                    onClick={() => setShowBoneTree(v => !v)}
                    className={`btn btn-sm ${showBoneTree ? 'btn-info text-white fw-bold' : 'btn-dark bg-opacity-50 border-secondary text-white'} py-1 px-2 small d-flex align-items-center gap-1`}
                    style={{ fontSize: 11 }}
                    title={showBoneTree ? "Masquer l'arbre des os" : "Afficher l'arborescence complète des os"}
                  >
                    <span>🌳</span>
                    <span>
                      {showBoneTree ? 'Masquer Os' : 'Arbre des Os'}
                      {skeletonGroups.length > 0 ? ` (${skeletonGroups.reduce((acc, s) => acc + s.totalBones, 0)})` : ''}
                    </span>
                  </button>
                )}
              </>
            )}

          </div>
          {showing3D && previewView !== 'free' && (
            <div
              style={{
                position: 'absolute',
                bottom: datumBannerBottom,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1,
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                padding: '3px 12px',
                borderRadius: 12,
                fontSize: 10,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>📐 Vue {cameraProjection === 'ortho' ? 'Ortho' : 'Perspective'} : <strong>{PREVIEW_VIEW_LABELS[previewView] ?? previewView}</strong></span>
              {previewView === 'top' ? (
                <>
                  <span style={{ color: '#00ff66', fontWeight: 'bold' }}>— Axe X (Bras)</span>
                  <span style={{ color: '#0088ff', fontWeight: 'bold' }}>— Axe Z (Regard)</span>
                  <span style={{ color: '#ffbb00' }}>┄ ±10 cm</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#00ff66', fontWeight: 'bold' }}>— 0 cm (Sol)</span>
                  <span style={{ color: '#ffbb00' }}>┄ +2 cm</span>
                  <span style={{ color: '#ff4444' }}>┄ -2 cm</span>
                </>
              )}
              <span style={{ color: '#aaa', fontSize: 9 }}>↕ Molette: Zoom | Glisser: Pan</span>
            </div>
          )}
          {/* Panneau latéral Section PNJ (Persistant en DOM pour préserver le scroll) */}
          <div
              style={{
                display: isHumanCharacter && item?.id !== 'unitree-h2' && showPnjPanel ? 'flex' : 'none',
                position: 'absolute',
                top: 40,
                right: 8,
                bottom: datumBannerBottom + (actionStates.characterAnim && actionStates.characterAnim !== 'idle' ? 68 : 12),
                width: 330,
                maxWidth: 'calc(100% - 16px)',
                zIndex: 9,
                background: '#ffffff',
                boxShadow: '-4px 4px 24px rgba(0, 0, 0, 0.35)',
                borderRadius: 8,
                border: '1px solid #ced4da',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '8px 12px',
                  background: '#f8f9fa',
                  borderBottom: '1px solid #dee2e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12, color: '#212529' }}>
                  <span>💃</span>
                  <span>Section PNJ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPnjPanel(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 16,
                    lineHeight: 1,
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: '0 4px'
                  }}
                  title="Fermer"
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px 16px 6px' }}>
                <CharacterSection
                  layers={layers}
                  onToggleLayer={toggleLayer}
                  isMobile={false}
                  globalHairColor={globalHairColor}
                  setGlobalHairColor={(c) => {
                    setGlobalHairColor(c);
                    setActionStates(s => ({ ...s, previewHairColor: c }));
                    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: c } }));
                  }}
                  globalHaircut={globalHaircut}
                  setGlobalHaircut={(h) => {
                    setGlobalHaircut(h);
                    if (h !== 'original') lastWigRef.current = h;
                    setActionStates(s => ({ ...s, previewHaircut: h }));
                    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: h } }));
                  }}
                  lastWigRef={lastWigRef}
                  handleRandomHairColor={handleRandomHairColor}
                  handleRandomHaircut={handleRandomHaircut}
                />
              </div>
          </div>

          {showing3D && actionKeys.length > 0 && (
            <div className="position-absolute end-0 top-0 mt-5 me-2 z-3 d-flex flex-column gap-1">
              {actionKeys.map(key => {
                const action = getActionDef(key)!;
                if (action.type === 'select') return (
                  <select
                    key={key}
                    className="form-select form-select-sm"
                    aria-label={getActionLabel(key)}
                    data-object-action={key}
                    value={actionStates[key] ?? action.initialValue ?? action.options?.[0]?.value}
                    onChange={event => setActionStates(s => toggleObjectAction(key, s, event.target.value))}
                  >
                    {action.options!.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                );
                const on = !!actionStates[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => action.event
                      ? document.dispatchEvent(new CustomEvent(action.event, { detail: { key } }))
                      : setActionStates(s => toggleObjectAction(key, s))}
                    className={`btn btn-sm ${on && !action.event ? 'btn-primary' : 'btn-dark bg-opacity-50 border-secondary'} text-white py-1 px-2 small`}
                    aria-pressed={action.event ? undefined : on}
                    data-object-action={key}
                  >
                    {getActionLabel(key, actionStates[key] ?? action.initialValue ?? false)}
                  </button>
                );
              })}
            </div>
          )}

          {!hideFooter && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 10px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: 12 }}>{item.name}</div>
                <div style={{ opacity: 0.8 }}>
                  {item.dims.w}×{item.dims.d}×{item.dims.h} cm
                  {'price' in item && item.price ? ` · ${item.price} €` : ''}
                </div>
              </div>
              {item && 'url' in item && (item as InventoryItem).url && <a href={(item as InventoryItem).url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title={(item as InventoryItem).url} style={{ marginLeft: 8, color: '#7ab8ff', textDecoration: 'none', pointerEvents: 'auto' }}>🔗</a>}
            </div>
          )}
        </>
      )}
    </div>
    {item && !hideViewControlBar && (
      <ViewControlBar inline inventoryLayout activeCameraPos={showing3D && previewView !== 'free' ? previewView : null} showOrbitControls={showing3D} beforeAmbianceActions={showing3D && (
        <>
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${actionStates.showBones ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={toggleSkeleton}
          title={actionStates.showBones ? 'Masquer le squelette (K)' : 'Afficher le squelette (K)'}
          aria-label="Squelette"
          aria-pressed={!!actionStates.showBones}
        >
          <span aria-hidden="true">🦴</span>
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${wireframe ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setWireframe(v => !v)}
          title={wireframe ? 'Désactiver le wireframe' : 'Activer le wireframe'}
          aria-label={wireframe ? 'Désactiver le wireframe' : 'Activer le wireframe'}
          aria-pressed={wireframe}
        >
          <i className="bi bi-box" aria-hidden="true" />
        </button>
        </>
      )} toolbarActions={showing3D && (
        <>
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${showMiniPerf ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setShowMiniPerf(v => !v)}
          title={showMiniPerf ? 'Masquer les performances (H)' : 'Afficher les performances (H)'}
          aria-label={showMiniPerf ? 'Masquer les performances (H)' : 'Afficher les performances (H)'}
          aria-pressed={showMiniPerf}
        >
          <i className="bi bi-bar-chart-fill" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${showGrid ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setShowGrid(v => !v)}
          title={showGrid ? 'Masquer la grille et afficher le ciel' : 'Afficher la grille sur fond neutre'}
          aria-label={showGrid ? 'Masquer la grille et afficher le ciel' : 'Afficher la grille sur fond neutre'}
          aria-pressed={showGrid}
        >
          <i className="bi bi-grid-3x3" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${showDims ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setShowDims(v => !v)}
          title={showDims ? 'Masquer les dimensions' : 'Afficher les dimensions'}
          aria-label={showDims ? 'Masquer les dimensions' : 'Afficher les dimensions'}
          aria-pressed={showDims}
        >
          <i className="bi bi-rulers" aria-hidden="true" />
        </button>
        {isWigItem && (
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${simulateMotion ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            onClick={() => setSimulateMotion(v => !v)}
            title={simulateMotion ? 'Arrêter la simulation de mouvements (M)' : 'Simuler des mouvements (vent & bustes) (M)'}
            aria-label="Simulation de mouvements"
            aria-pressed={simulateMotion}
          >
            <i className="bi bi-wind" aria-hidden="true" />
          </button>
        )}
        {isHumanCharacter && item?.id !== 'unitree-h2' && (
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${showPnjPanel ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => setShowPnjPanel(v => !v)}
            title={showPnjPanel ? 'Masquer la section PNJ' : 'Afficher la section PNJ (Physique buste, tenues, perruques...)'}
            aria-pressed={showPnjPanel}
          >💃 <span className="fw-semibold">Section PNJ</span></button>
        )}
        </>
      )}>
        {showing3D && isCharacterItem && !hideAnimFrameController && (
          <AnimFrameController
            compact
            animName={actionStates.duoAnimDef ? actionStates.duoAnimDef.label : currentAnimLabel}
            animKey={actionStates.characterAnim || (item.id === 'black-hornet-drone' ? 'Drone_Hover' : undefined)}
            isHumanCharacter={isHumanCharacter}
            characterId={item.id}
            duoAnimDef={actionStates.duoAnimDef}
            duoPartnerId={duoParticipants?.partnerId ?? actionStates.duoPartnerId}
            animalAnimOptions={animalAnimOptions}
            onSelectAnim={(val) => {
              lastSoloAnimRef.current = val;
              setActionStates(s => ({ ...s, characterAnim: val, duoAnimDef: undefined }));
              useAnimPreviewStore.getState().play();
            }}
            onSelectDuoAnim={(def) => {
              if (!actionStates.duoAnimDef) lastSoloAnimRef.current = actionStates.characterAnim || 'idle';
              const otherChars = CHARACTERS.filter(c => c.id !== item.id && (extraCharacters || !isExtraCharacter(c.id)));
              const defaultPartner = otherChars.find(c => c.id === actionStates.duoPartnerId)?.id || otherChars[0]?.id;
              setActionStates(s => ({
                ...s,
                duoAnimDef: def,
                duoPartnerId: defaultPartner,
                isPaused: false,
                characterAnim: def ? undefined : lastSoloAnimRef.current,
              }));
              useAnimPreviewStore.getState().play();
            }}
            onSelectDuoPartner={(partnerId) => {
              setActionStates(s => ({ ...s, duoPartnerId: partnerId }));
            }}
            style={{
              position: 'relative',
              inset: 'auto',
              width: '100%',
              margin: 0,
              zIndex: 2,
            }}
          />
        )}
      </ViewControlBar>
    )}
    {item && hasPhotos && showPhotoGallery && (
      <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '8px', width: '100%', background: '#eaeaea' }}>
        {has3D && (
          <div onClick={() => setViewMode('3d')} style={{ width: 56, height: 56, flexShrink: 0, border: '1px solid #ccc', borderRadius: 4, background: viewMode === '3d' ? '#ddd' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: viewMode === '3d' ? 0.5 : 1 }} title="Vue 3D">
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#555' }}>3D</span>
          </div>
        )}
        {photos!.map((p, i) => (
          <img key={i} src={p} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', opacity: photoIdx === i && viewMode === 'photos' ? 0.5 : 1 }} onClick={() => { setPhotoIdx(i); setViewMode('photos'); }} title="Voir cette photo" />
        ))}
      </div>
    )}
    </div>
  );
}
