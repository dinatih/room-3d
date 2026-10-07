import { useState, useRef, useLayoutEffect, useCallback, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { type InventoryItem, type StorageSpace, WIGS_ITEMS } from './inventoryData';
import { SCENE_REGISTRY, ACTION_LABELS } from './previewRegistry';
import { GlobalSkeletonHelpers } from '@features/scene/utils/GlobalSkeletonHelpers';
import { SkeletonHierarchyPanel } from '@features/scene/utils/SkeletonHierarchyPanel';
import type { SkeletonGroup } from '@features/scene/utils/skeletonTypes';
import { WALKER_ANIM_OPTIONS } from '@features/scene/animOptions';
import { resolveAnimationId } from '@features/scene/animations/animationResolver';
import type { DuoAnimationDef } from '@features/scene/animations/duoAnimations';
import { CHARACTERS, isExtraCharacter } from '@features/scene/characterConfig';
import { GroundPoint } from '@features/scene/character/GroundPoint';
import { SkySphere } from '@features/scene/SkySphere';
import { useAnimPreviewStore } from './useAnimPreviewStore';
import { AnimFrameController } from './AnimFrameController';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { CharacterSection } from '@features/scene/sidepanel/sections/CharacterSection';
import { ViewControlBar } from '@features/scene/ViewControlBar';
import { getOrbitMouseButtons } from '@features/scene/camera/orbitMouseButtons';
import { TOOLBAR_BUTTON_CLASS } from '@features/scene/toolbarStyles';

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
type PreviewOrthoView = 'front' | 'back' | 'side' | 'right' | 'top' | 'bottom';
type PreviewIsoView = 'iso-se' | 'iso-sw' | 'iso-ne' | 'iso-nw';
type PreviewPresetView = PreviewOrthoView | PreviewIsoView;
type PreviewCameraView = 'free' | PreviewPresetView;
type ViewDirection = [number, number, number];

const PREVIEW_VIEW_DIRECTIONS: Record<PreviewPresetView, ViewDirection> = {
  front: [0, 0, 1], back: [0, 0, -1], side: [-1, 0, 0], right: [1, 0, 0],
  top: [0, 1, 0], bottom: [0, -1, 0],
  'iso-se': [1, 1, 1], 'iso-sw': [-1, 1, 1], 'iso-ne': [1, 1, -1], 'iso-nw': [-1, 1, -1],
};
const PREVIEW_VIEW_LABELS: Record<PreviewPresetView, string> = {
  front: 'Face', back: 'Arrière', side: 'Profil Gauche', right: 'Profil Droit',
  top: 'Dessus', bottom: 'Dessous',
  'iso-se': 'ISO Sud-Est', 'iso-sw': 'ISO Sud-Ouest', 'iso-ne': 'ISO Nord-Est', 'iso-nw': 'ISO Nord-Ouest',
};

function getPreviewViewDirection(mode: PreviewPresetView): THREE.Vector3 {
  return new THREE.Vector3(...PREVIEW_VIEW_DIRECTIONS[mode]).normalize();
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
  const pill: React.CSSProperties = { background: 'rgba(255, 255, 255, 0.4)', padding: '2px 5px', color: LC, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', backdropFilter: 'blur(3px)', borderRadius: 3 };

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
      camera.far = Math.max(2000, dist * 20);
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

  const camPos: [number, number, number] = useMemo(() => {
    if (mode === 'free') {
      const distance = Math.max(100, boundsRadius * 3.2);
      return [target[0] + distance * 0.75, target[1] + distance * 0.45, target[2] + distance * 0.95];
    }
    const direction = getPreviewViewDirection(mode);
    return [
      camTarget[0] + direction.x * 1000,
      camTarget[1] + direction.y * 1000,
      camTarget[2] + direction.z * 1000,
    ];
  }, [mode, camTarget, boundsRadius, target]);

  useLayoutEffect(() => {
    camera.layers.enableAll();
    if (camRef.current) {
      camRef.current.layers.enableAll();
      camRef.current.left = -viewW / 2;
      camRef.current.right = viewW / 2;
      camRef.current.top = viewH / 2;
      camRef.current.bottom = -viewH / 2;
      if (mode === 'top') {
        camRef.current.up.set(0, 0, -1);
      } else if (mode === 'bottom') {
        camRef.current.up.set(0, 0, 1);
      } else {
        camRef.current.up.set(0, 1, 0);
      }
      camRef.current.position.set(camPos[0], camPos[1], camPos[2]);
      camRef.current.lookAt(camTarget[0], camTarget[1], camTarget[2]);
      camRef.current.updateProjectionMatrix();
    }
  }, [camera, mode, camPos, camTarget, viewW, viewH]);

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
        far={5000}
      />
      <OrbitControls
        ref={ctrlRef}
        makeDefault
        mouseButtons={getOrbitMouseButtons(orbitMouseMode)}
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
  mode: PreviewPresetView;
  target?: [number, number, number];
  boundsRadius?: number;
}) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const orbitMouseMode = useSceneStore(state => state.orbitMouseMode);
  const ctrlRef = useRef<any>(null);
  const camTarget = useMemo<[number, number, number]>(() => (
    mode === 'top' || mode === 'bottom' ? [0, 0, 0] : [0, target[1] || 85, 0]
  ), [mode, target]);
  const distance = Math.max(100, (boundsRadius || 50) * 3.2);
  const direction = useMemo(() => getPreviewViewDirection(mode), [mode]);
  const up = useMemo<[number, number, number]>(() => (
    mode === 'top' ? [0, 0, -1] : mode === 'bottom' ? [0, 0, 1] : [0, 1, 0]
  ), [mode]);
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
      <OrbitControls ref={ctrlRef} makeDefault mouseButtons={getOrbitMouseButtons(orbitMouseMode)} target={camTarget} enablePan enableZoom screenSpacePanning minDistance={2} maxDistance={2500} />
    </>
  );
}

function GroundDatumLines({ mode }: { mode: PreviewOrthoView }) {
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

  const isSide = mode === 'side' || mode === 'right';

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

function CenteredItem({ Component, actionState, item, grounded = false, preserveOriginXZ = false, showDims = false, glbPath, onTargetChange, onBoundsChange, onStats }: { Component?: any; actionState: Record<string, any>; item: PreviewTarget; grounded?: boolean; preserveOriginXZ?: boolean; showDims?: boolean; glbPath?: string; onTargetChange?: (t: [number, number, number]) => void; onBoundsChange?: (radius: number) => void; onStats?: (s: GlbDebugStats) => void; }) {
  const outerRef = useRef<THREE.Group>(null!), innerRef = useRef<THREE.Group>(null!);
  const [worldSize, setWorldSize] = useState<{ x: number; y: number; z: number } | null>(null);
  const lastTargetYRef = useRef<number | null>(null);
  const lastRadiusRef = useRef<number | null>(null);
  const lastStatsRef = useRef<{ sz?: number; tris: number; calls: number } | null>(null);

  const fit = useCallback(() => {
    if (!outerRef.current || !innerRef.current) return;
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

    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const newRadius = Math.max(15, sphere.radius);
    if (lastRadiusRef.current === null || Math.abs(lastRadiusRef.current - newRadius) > 0.5) {
      lastRadiusRef.current = newRadius;
      onBoundsChange?.(newRadius);
    }

    if (onTargetChange) {
      const targetY = grounded ? size.y / 2 : 0;
      if (lastTargetYRef.current === null || Math.abs(lastTargetYRef.current - targetY) > 0.1) {
        lastTargetYRef.current = targetY;
        onTargetChange([0, targetY, 0]);
      }
    }
  }, [grounded, preserveOriginXZ, onTargetChange, onBoundsChange, onStats, glbPath]);

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
          {Component ? <Component item={item ?? {} as any} actionState={actionState} onSize={fit} /> : <GlbScene glbPath={glbPath!} onSize={fit} onStats={onStats} />}
        </group>
      </group>
      <GroundPoint color="#0058a3" />
      {showDims && item?.dims && worldSize && <Dimensions dims={item.dims} worldSize={worldSize} grounded={grounded} />}
    </group>
  );
}

function RegistryScene({ item, actionState, showDims, onTargetChange, onBoundsChange, onStats }: { item: InventoryItem; actionState: Record<string, any>; showDims: boolean; onTargetChange?: (t: [number, number, number]) => void; onBoundsChange?: (r: number) => void; onStats?: (s: GlbDebugStats) => void; }) {
  const Component = SCENE_REGISTRY[item.id], isCharacter = item.category === 'characters';
  return <CenteredItem Component={Component} actionState={actionState} item={item} grounded={true} preserveOriginXZ={isCharacter} showDims={showDims} glbPath={item.glbPath} onTargetChange={onTargetChange} onBoundsChange={onBoundsChange} onStats={onStats} />;
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
  onGlbStats,
}: {
  item: PreviewTarget;
  width?: string | number;
  height?: string | number;
  hideFooter?: boolean;
  initialDuoAnim?: DuoAnimationDef;
  initialDuoPartner?: string;
  onGlbStats?: (s: GlbDebugStats | null) => void;
}) {
  const glbPath = item && 'glbPath' in item ? item.glbPath : undefined, photos = item && 'photos' in item ? (item as InventoryItem).photos : undefined;
  const hasRegistry = item ? !!SCENE_REGISTRY[item.id] : false, has3D = !!glbPath || hasRegistry, hasPhotos = !!photos && photos.length > 0;
  const actionKeys: string[] = item && 'category' in item && (item as InventoryItem).category === 'characters' ? [] : ((item as any)?.actions || []);
  const [actionStates, setActionStates] = useState<Record<string, any>>({}), [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d'), [showDims, setShowDims] = useState(false), [autoRotate, setAutoRotate] = useState(true);
  const [target, setTarget] = useState<[number, number, number]>([0, 0, 0]);
  const [boundsRadius, setBoundsRadius] = useState<number>(50);
  const [showGrid, setShowGrid] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [previewView, setPreviewView] = useState<PreviewCameraView>('free');
  const cameraProjection = useSceneStore(state => state.cameraProjection);
  const orbitMouseMode = useSceneStore(state => state.orbitMouseMode);
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const layers = useSceneStore(state => state.layers);
  const toggleLayer = useSceneStore(state => state.toggleLayer);

  const [showPnjPanel, setShowPnjPanel] = useState<boolean>(false);
  const [selectedBoneName, setSelectedBoneName] = useState<string | null>(null);
  const [skeletonGroups, setSkeletonGroups] = useState<SkeletonGroup[]>([]);
  const [showBoneTree, setShowBoneTree] = useState<boolean>(false);
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

  const handleRandomHaircutAndColor = () => {
    handleRandomHaircut();
    handleRandomHairColor();
  };

  useEffect(() => {
    setActionStates(initialDuoAnim ? {
      duoAnimDef: initialDuoAnim,
      duoPartnerId: initialDuoPartner || (item?.id === 'native' ? 'rosanna' : 'native'),
    } : {});
    lastSoloAnimRef.current = 'idle';
    setViewMode('3d');
    setAutoRotate(true);
    setTarget([0, 0, 0]);
    setBoundsRadius(50);
    setPhotoIdx(0);
    setShowPnjPanel(false);
    setSelectedBoneName(null);
    setSkeletonGroups([]);
    setShowBoneTree(false);
    setPreviewView('free');
    useAnimPreviewStore.getState().reset();
  }, [item?.id]);

  // Map ViewControlBar camera-view events to preview ortho views
  useEffect(() => {
    const onView = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const key = detail.key as string;
      if (detail.projection === 'ortho' || detail.projection === 'persp') {
        useSceneStore.getState().setCameraProjection(detail.projection);
      }
      if (key === 'front' || key === 'back' || key === 'left' || key === 'right' ||
          key === 'top' || key === 'bottom') {
        // Map left→side, right→right, rest stays the same
        const mapped = key === 'left' ? 'side' : key;
        setPreviewView(mapped as PreviewOrthoView);
        setAutoRotate(false);
      } else if (key === 'iso-se' || key === 'iso-sw' || key === 'iso-ne' || key === 'iso-nw') {
        setPreviewView(key);
        setAutoRotate(false);
      } else {
        setPreviewView('free');
      }
    };
    document.addEventListener('camera-view', onView);
    return () => document.removeEventListener('camera-view', onView);
  }, []);

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
  }, [initialDuoAnim, initialDuoPartner]);

  const showing3D = has3D && (!hasPhotos || viewMode === '3d'), showingPhotos = hasPhotos && (!has3D || viewMode === 'photos');

  const isCharacterItem = showing3D && item && 'category' in item && ((item as any).category === 'characters');
  const isHumanCharacter = Boolean(isCharacterItem && !['ushiro', 'shiba-inu', 'robin-bird', 'jikin-goldfish', 'tosakin-goldfish'].includes(item.id));

  const animalAnimOptions = useMemo(() => {
    if (!item?.id) return undefined;
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
  const debugUrlsBottom = hideFooter ? 4 : 40;
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
        setActionStates(s => ({ ...s, showBones: !s.showBones }));
        return;
      }

    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="inventory-preview-container" style={{ width }}>
      <div className="inventory-preview-canvas-wrap" style={{ height: height === '100%' ? undefined : height }}>
        {!item && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 12, pointerEvents: 'none' }}>Sélectionner un objet</div>}
      {item && (
        <>
          {has3D && hasPhotos && (
            <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, display: 'flex', gap: 3 }}>
              {(['3d', 'photos'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '2px 7px', fontSize: 10, background: viewMode === mode ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.35)', border: viewMode === mode ? '1px solid #aaa' : '1px solid transparent', borderRadius: 4, color: '#eee', cursor: 'pointer' }}>{mode === '3d' ? '3D' : `📷 ${photos!.length}`}</button>
              ))}
            </div>
          )}
          {showing3D ? (
            <Canvas key={item.id} frameloop="always" camera={{ fov: 45, near: 0.5, far: 10000, position: [70, 50, 90] }} gl={{ antialias: true, alpha: false, toneMapping: THREE.AgXToneMapping }} onCreated={({ scene, camera, gl }) => { camera.layers.enableAll(); scene.background = new THREE.Color('#d2d2d2'); gl.toneMapping = THREE.AgXToneMapping; }}>
              <SkySphere envOnly={showGrid} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[150, 250, 150]} intensity={1.0} />
              <directionalLight position={[-100, 50, -100]} intensity={0.4} color="#aabbff" />
              {cameraProjection === 'ortho' ? (
                <>
                  <OrthoCameraControls mode={previewView} target={target} boundsRadius={boundsRadius} />
              {showGrid && previewView !== 'free' && !previewView.startsWith('iso-') &&
                <GroundDatumLines mode={previewView as PreviewOrthoView} />}
                </>
              ) : (
                <>
                  {previewView === 'free' ? (
                    <>
                      <FitCamera target={target} boundsRadius={boundsRadius} />
                      <OrbitControls mouseButtons={getOrbitMouseButtons(orbitMouseMode)} autoRotate={autoRotate} autoRotateSpeed={1.2} enablePan enableZoom target={target} onStart={() => setAutoRotate(false)} />
                    </>
                  ) : (
                    <PerspectivePresetControls mode={previewView} target={target} boundsRadius={boundsRadius} />
                  )}
                </>
              )}
              {showGrid && <Grid infiniteGrid fadeDistance={Math.max(800, boundsRadius * 20)} cellColor="#777777" sectionColor="#444444" cellSize={10} sectionSize={50} position={[0, -0.01, 0]} />}
              <Suspense fallback={null}><RegistryScene item={item as InventoryItem} actionState={actionStates} showDims={showDims} onTargetChange={setTarget} onBoundsChange={setBoundsRadius} onStats={onGlbStats} /></Suspense>
              <GlobalSkeletonHelpers
                show={actionStates.showBones}
                selectedBoneName={selectedBoneName}
                onSelectBoneName={setSelectedBoneName}
                onSkeletonGroupsChange={setSkeletonGroups}
              />
            </Canvas>
          ) : showingPhotos ? <PhotoGallery key={item.id + '-photos'} photos={photos!} initialIndex={photoIdx} onIndexChange={setPhotoIdx} /> : null}
          <div className="position-absolute top-0 end-0 m-2 z-3 d-flex gap-2 align-items-center">
            {showing3D && 'category' in item && ((item as any).category === 'characters' || (item as any).category === 'wigs') && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActionStates(s => {
                      const next = !s.showBones;
                      if (!next) {
                        setSelectedBoneName(null);
                        setShowBoneTree(false);
                      }
                      return { ...s, showBones: next };
                    });
                  }}
                  className={`btn btn-sm ${actionStates.showBones ? 'btn-primary' : 'btn-dark bg-opacity-50 border-secondary'} text-white py-1 px-2 small`}
                  style={{ fontSize: 11 }}
                  title="Afficher/masquer le squelette 3D"
                >
                  {actionStates.showBones ? '🦴 Cacher Squelette' : '🦴 Voir Squelette'}
                </button>

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

            {isHumanCharacter && (
              <button
                type="button"
                onClick={() => setShowPnjPanel(v => !v)}
                className={`btn btn-sm ${showPnjPanel ? 'btn-danger fw-bold' : 'btn-dark bg-opacity-50 border-secondary'} text-white py-1 px-2 small d-flex align-items-center gap-1`}
                style={{ fontSize: 11 }}
                title={showPnjPanel ? "Masquer la section PNJ" : "Afficher la section PNJ (Physique buste, tenues, perruques...)"}
              >
                <span>💃</span>
                <span>{showPnjPanel ? 'Masquer Section PNJ' : 'Section PNJ'}</span>
              </button>
            )}

          </div>
          {showing3D && previewView !== 'free' && (
            <div
              style={{
                position: 'absolute',
                bottom: datumBannerBottom,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(6px)',
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
              <span>📐 Vue {cameraProjection === 'ortho' ? 'Ortho' : 'Perspective'} : <strong>{PREVIEW_VIEW_LABELS[previewView as PreviewPresetView]}</strong></span>
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
          {/* Menu Arbre des os & Influence heatmap */}
          {showing3D && actionStates.showBones && (showBoneTree || selectedBoneName) && (
            <div
              className="position-absolute top-0 start-0 m-2 mt-5 z-3 d-flex flex-column gap-2"
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

          {/* Panneau latéral Section PNJ (Persistant en DOM pour préserver le scroll) */}
          <div
              style={{
                display: isHumanCharacter && showPnjPanel ? 'flex' : 'none',
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
                  handleRandomHaircutAndColor={handleRandomHaircutAndColor}
                  handleRandomHairColor={handleRandomHairColor}
                  handleRandomHaircut={handleRandomHaircut}
                />
              </div>
          </div>

          {showing3D && actionKeys.length > 0 && (
            <div className="position-absolute end-0 top-0 mt-5 me-2 z-3 d-flex flex-column gap-1">
              {actionKeys.map(key => {
                const labels = ACTION_LABELS[key] ?? ['Ouvrir', 'Fermer'], on = !!actionStates[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActionStates(s => ({ ...s, [key]: !on }))}
                    className={`btn btn-sm ${on ? 'btn-primary' : 'btn-dark bg-opacity-50 border-secondary'} text-white py-1 px-2 small`}
                    style={{ fontSize: 11 }}
                  >
                    {on ? labels[1] : labels[0]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Debug URLs Overlay */}
          <div
            className="position-absolute text-truncate mw-100 font-monospace pe-none"
            style={{
              bottom: debugUrlsBottom,
              left: 8,
              zIndex: 3,
              fontSize: 9,
              opacity: 0.5,
              color: '#222',
              textShadow: '0 0 2px rgba(255,255,255,0.8)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            title={`${glbPath || 'No GLB'} | ${photos ? photos.join(', ') : 'No photos'}`}
          >
            {glbPath ? `GLB: ${glbPath}` : 'No GLB'} {photos && photos.length > 0 ? `| IMG: ${photos[0]} ${photos.length > 1 ? `(+${photos.length-1})` : ''}` : ''}
          </div>

          {!hideFooter && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center' }}>
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
    {item && (
      <ViewControlBar inline showOrbitControls={showing3D} toolbarActions={showing3D && (
        <>
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${showGrid ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setShowGrid(v => !v)}
          title={showGrid ? 'Masquer la grille et afficher le ciel' : 'Afficher la grille'}
          aria-label={showGrid ? 'Masquer la grille et afficher le ciel' : 'Afficher la grille'}
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
        </>
      )}>
        {showing3D && isCharacterItem && (
          <AnimFrameController
            compact
            animName={actionStates.duoAnimDef ? actionStates.duoAnimDef.label : currentAnimLabel}
            animKey={actionStates.characterAnim}
            isHumanCharacter={isHumanCharacter}
            characterId={item.id}
            duoAnimDef={actionStates.duoAnimDef}
            duoPartnerId={actionStates.duoPartnerId}
            animalAnimOptions={animalAnimOptions}
            onSelectAnim={(val) => {
              lastSoloAnimRef.current = val;
              setActionStates(s => ({ ...s, characterAnim: val, duoAnimDef: undefined }));
              useAnimPreviewStore.getState().play();
            }}
            onSelectDuoAnim={(def) => {
              if (!actionStates.duoAnimDef) lastSoloAnimRef.current = actionStates.characterAnim || 'idle';
              const otherChars = CHARACTERS.filter(c => c.id !== item.id && (extraCharacters || !isExtraCharacter(c.id)));
              const defaultPartner = actionStates.duoPartnerId || (otherChars[0]?.id ?? 'rosanna');
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
    {item && hasPhotos && (
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
