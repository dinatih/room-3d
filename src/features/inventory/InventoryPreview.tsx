import { useState, useRef, useLayoutEffect, useCallback, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { type InventoryItem, type StorageSpace, WIGS_ITEMS } from './inventoryData';
import { SCENE_REGISTRY, ACTION_LABELS } from './previewRegistry';
import { GlobalSkeletonHelpers } from '@features/scene/utils/GlobalSkeletonHelpers';
import { CharacterAnimSelector } from '@features/scene/CharacterAnimSelector';
import { WALKER_ANIM_OPTIONS } from '@features/scene/animOptions';
import { DUO_ANIMATIONS, type DuoAnimationDef } from '@features/scene/ai/duoAnimations';
import { CHARACTERS } from '@features/scene/walkerConfig';

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

function GlbScene({ glbPath, onSize, onStats }: { glbPath: string; onSize?: () => void; onStats?: (s: GlbDebugStats) => void }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
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
        setScene(gltf.scene);

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
      setScene(previous => {
        if (previous) disposePreviewScene(previous);
        return null;
      });
    };
  }, [glbPath, onStats]);

  useLayoutEffect(() => {
    if (scene) onSize?.();
  }, [scene, onSize]);

  if (!scene) return null; return <primitive object={scene} dispose={null} />;
}

function Dimensions({ dims, worldSize, grounded = false }: { dims: { w: number, d: number, h: number }; worldSize: { x: number; y: number; z: number }; grounded?: boolean; }) {
  const hx = worldSize.x / 2, hy = worldSize.y / 2, hz = worldSize.z / 2, off = 0.08, LC = '#0058a3';
  const pill: React.CSSProperties = { background: 'rgba(255, 255, 255, 0.25)', padding: '1px 3px', color: LC, fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none', backdropFilter: 'blur(2px)', borderRadius: 2 };
  
  const axes = useMemo(() => {
    const h = new THREE.AxesHelper(0.5);
    h.renderOrder = 999; (h.material as THREE.Material).depthTest = false;
    return h;
  }, []);

  const groupY = grounded ? 0 : -hy;

  return (
    <group position={[0, groupY, 0]}>
      <primitive object={axes} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.015, 0.02, 32]} />
        <meshBasicMaterial color={LC} transparent opacity={0.3} />
      </mesh>

      {/* Height */}
      <Line points={[[hx + off, 0, hz], [hx + off, hy * 2, hz]]} color={LC} lineWidth={1} />
      <Html position={[hx + off, hy, hz]} center distanceFactor={2}><div style={pill}>{dims.h} cm</div></Html>
      
      {/* Width */}
      <Line points={[[-hx, 0, hz], [-hx, -off, hz + off]]} color={LC} lineWidth={1} />
      <Line points={[[ hx, 0, hz], [ hx, -off, hz + off]]} color={LC} lineWidth={1} />
      <Line points={[[-hx, -off, hz + off], [hx, -off, hz + off]]} color={LC} lineWidth={1} />
      <Html position={[0, -off, hz + off]} center distanceFactor={2}><div style={pill}>{dims.w} cm</div></Html>
      
      {/* Depth */}
      <Line points={[[hx, 0, -hz], [hx + off, 0, -hz - off]]} color={LC} lineWidth={1} />
      <Line points={[[hx, 0,  hz], [hx + off, 0,  hz + off]]} color={LC} lineWidth={1} />
      <Line points={[[hx + off, 0, -hz - off], [hx + off, 0, hz + off]]} color={LC} lineWidth={1} />
      <Html position={[hx + off, 0, 0]} center distanceFactor={2} rotation={[0, Math.PI / 2, 0]}><div style={pill}>{dims.d} cm</div></Html>
    </group>
  );
}

function FitCamera({ target = [0, 0, 0] }: { target?: [number, number, number] }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.layers.enableAll();
    camera.lookAt(new THREE.Vector3(...target));
  }, [camera, target]);
  return null;
}

function CenteredItem({ Component, actionState, item, grounded = false, preserveOriginXZ = false, showDims = false, glbPath, onTargetChange, onStats }: { Component?: any; actionState: Record<string, any>; item: PreviewTarget; grounded?: boolean; preserveOriginXZ?: boolean; showDims?: boolean; glbPath?: string; onTargetChange?: (t: [number, number, number]) => void; onStats?: (s: GlbDebugStats) => void; }) {
  const outerRef = useRef<THREE.Group>(null!), innerRef = useRef<THREE.Group>(null!), [, setScale] = useState(1);
  const [worldSize, setWorldSize] = useState<{ x: number; y: number; z: number } | null>(null);

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
      onStats({
        fileSize: sz,
        triangles: Math.round(totalTris),
        drawCalls: totalMeshes,
      });
    }

    if (box.isEmpty()) return;
    
    // Calculate sizing based on the actual world-space box of the scaled model
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const max = Math.max(size.x, size.y, size.z);
    
    // We want the item to fit comfortably in the preview scene
    const s = 1.0 / max;
    setScale(s); 
    setWorldSize({ x: size.x * s, y: size.y * s, z: size.z * s });
    outerRef.current.scale.setScalar(s);
    
    // Offset outer group to center the item
    const px = preserveOriginXZ ? 0 : -center.x * s;
    const pz = preserveOriginXZ ? 0 : -center.z * s;

    if (grounded) {
      // Position the root so that the lowest point of the mesh (box.min.y) is at Y=0
      outerRef.current.position.set(px, -box.min.y * s, pz);
    } else {
      // Center vertically in view
      outerRef.current.position.set(px, -center.y * s, pz);
    }

    if (onTargetChange) {
      if (grounded) {
        onTargetChange([0, (size.y * s) / 2, 0]);
      } else {
        onTargetChange([0, 0, 0]);
      }
    }
  }, [grounded, preserveOriginXZ, onTargetChange, onStats, glbPath]);

  useLayoutEffect(() => {
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
      {showDims && item?.dims && worldSize && <Dimensions dims={item.dims} worldSize={worldSize} grounded={grounded} />}
    </group>
  );
}

function RegistryScene({ item, actionState, showDims, onTargetChange, onStats }: { item: InventoryItem; actionState: Record<string, any>; showDims: boolean; onTargetChange?: (t: [number, number, number]) => void; onStats?: (s: GlbDebugStats) => void; }) {
  const Component = SCENE_REGISTRY[item.id], isWalker = item.category === 'walkers';
  return <CenteredItem Component={Component} actionState={actionState} item={item} grounded={true} preserveOriginXZ={isWalker} showDims={showDims} glbPath={item.glbPath} onTargetChange={onTargetChange} onStats={onStats} />;
}

function PhotoGallery({ photos, initialIndex = 0, onIndexChange }: { photos: string[], initialIndex?: number, onIndexChange?: (i: number) => void }) {
  const [idx, setIdx] = useState(initialIndex);
  useEffect(() => { setIdx(initialIndex); }, [initialIndex]);

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
  const actionKeys: string[] = item && 'category' in item && (item as InventoryItem).category === 'walkers' ? [] : ((item as any)?.actions || []);
  const [actionStates, setActionStates] = useState<Record<string, any>>({}), [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d'), [showDims, setShowDims] = useState(false), [autoRotate, setAutoRotate] = useState(true);
  const [target, setTarget] = useState<[number, number, number]>([0, 0, 0]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAnimSelector, setShowAnimSelector] = useState(false);
  useEffect(() => {
    setActionStates(initialDuoAnim ? {
      duoAnimDef: initialDuoAnim,
      duoPartnerId: initialDuoPartner || (item?.id === 'native' ? 'rosanna' : 'native'),
    } : {});
    setViewMode('3d');
    setAutoRotate(true);
    setTarget([0, 0, 0]);
    setPhotoIdx(0);
    setShowAnimSelector(false);
  }, [item?.id]);

  useEffect(() => {
    if (initialDuoAnim) {
      setActionStates(s => ({
        ...s,
        duoAnimDef: initialDuoAnim,
        duoPartnerId: initialDuoPartner || s.duoPartnerId || (item?.id === 'native' ? 'rosanna' : 'native'),
        walkerAnim: undefined,
        isPaused: false
      }));
    }
  }, [initialDuoAnim, initialDuoPartner]);

  // Raccourci clavier 'K' pour afficher / masquer le squelette dans la preview 3D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement;
      if (targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.isContentEditable)) {
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        setActionStates(s => ({ ...s, showBones: !s.showBones }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showing3D = has3D && (!hasPhotos || viewMode === '3d'), showingPhotos = hasPhotos && (!has3D || viewMode === 'photos');

  const isWalkerItem = showing3D && item && 'category' in item && ((item as any).category === 'walkers');
  const isHumanWalker = isWalkerItem && !['ushiro', 'shiba-inu', 'robin-bird'].includes(item.id);
  const currentAnimOpt = isHumanWalker ? WALKER_ANIM_OPTIONS.find(a => a.value === (actionStates.walkerAnim || 'idle')) : null;
  const currentAnimLabel = actionStates.walkerAnim === 'tpose'
    ? 'T-Pose'
    : (currentAnimOpt ? currentAnimOpt.label : (actionStates.walkerAnim || 'Idle'));

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
            <Canvas key={item.id} frameloop="always" camera={{ fov: 45, near: 0.01, far: 100, position: [1.4, 0.9, 1.8] }} gl={{ antialias: true, alpha: false }} onCreated={({ scene, camera }) => { camera.layers.enableAll(); scene.background = new THREE.Color('#d2d2d2'); scene.fog = new THREE.Fog('#d2d2d2', 4, 15); }}>
              <ambientLight intensity={1.2} />
              <directionalLight position={[3, 5, 3]} intensity={1.5} />
              <directionalLight position={[-2, 1, -2]} intensity={0.5} color="#aabbff" />
              <FitCamera target={target} />
              <OrbitControls autoRotate={autoRotate} autoRotateSpeed={1.2} enablePan={true} minDistance={0.3} maxDistance={50} target={target} onStart={() => setAutoRotate(false)} />
              <Grid infiniteGrid fadeDistance={15} cellColor="#999999" sectionColor="#666666" cellSize={0.2} sectionSize={1} position={[0, -0.001, 0]} />
              <Suspense fallback={null}><RegistryScene item={item as InventoryItem} actionState={actionStates} showDims={showDims} onTargetChange={setTarget} onStats={onGlbStats} /></Suspense>
              <GlobalSkeletonHelpers show={actionStates.showBones} />
            </Canvas>
          ) : showingPhotos ? <PhotoGallery key={item.id + '-photos'} photos={photos!} initialIndex={photoIdx} onIndexChange={setPhotoIdx} /> : null}
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={() => setShowDims(v => !v)} style={{ padding: '3px 8px', fontSize: 11, background: 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>📏 {showDims ? 'Masquer Dims' : 'Afficher Dims'}</button>
          </div>
          {showing3D && 'category' in item && ((item as any).category === 'walkers' || (item as any).category === 'wigs') && (
            <div style={{ position: 'absolute', top: 40, left: 8, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 4 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setActionStates(s => ({ ...s, showBones: !s.showBones }))} style={{ padding: '3px 8px', fontSize: 11, background: actionStates.showBones ? '#0058a3' : 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>{actionStates.showBones ? '🦴 Cacher Squelette' : '🦴 Voir Squelette'}</button>
              
              {(item as any).category === 'walkers' && (
                <>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <button onClick={() => setActionStates(s => ({ ...s, isPaused: !s.isPaused }))} style={{ padding: '3px 8px', fontSize: 11, background: actionStates.isPaused ? '#e63946' : 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }} title={actionStates.isPaused ? "Play" : "Pause"}>{actionStates.isPaused ? '▶️' : '⏸️'}</button>
                    {isHumanWalker && (
                      <>
                        <button onClick={() => setActionStates(s => ({ ...s, walkerAnim: 'tpose' }))} style={{ padding: '3px 8px', fontSize: 11, background: actionStates.walkerAnim === 'tpose' ? '#2a9d3a' : 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }} title="T-Pose (Rest)">📐</button>
                        <button
                          type="button"
                          onClick={() => {
                            const pool = WALKER_ANIM_OPTIONS.filter(a => a.value !== 'idle' && a.value !== 'tpose' && a.value !== 'animations/poses_idles/anim_t_pose.glb');
                            if (pool.length > 0) {
                              const randomAnim = pool[Math.floor(Math.random() * pool.length)];
                              setActionStates(s => ({ ...s, walkerAnim: randomAnim.value, isPaused: false }));
                            }
                          }}
                          style={{ padding: '3px 8px', fontSize: 11, background: '#ffc107', color: '#000', border: '1px solid #d39e00', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                          title="Lancer une animation aléatoire"
                        >
                          🎲
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionStates(s => ({ ...s, walkerAnim: 'idle', isPaused: false }));
                          }}
                          style={{ padding: '3px 8px', fontSize: 11, background: '#6c757d', color: '#fff', border: '1px solid #545b62', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                          title="Remettre en Idle / Arrêter l'animation"
                        >
                          ⏹️
                        </button>
                      </>
                    )}
                  </div>

                  {isHumanWalker ? (
                    <button
                      onClick={() => {
                        setShowAnimSelector(v => !v);
                        if (!showAnimSelector) {
                          setActionStates(s => ({ ...s, duoAnimDef: undefined }));
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: 10,
                        fontWeight: 'bold',
                        background: showAnimSelector ? '#c82333' : 'rgba(0,0,0,0.7)',
                        border: `1px solid ${showAnimSelector ? '#dc3545' : '#555'}`,
                        borderRadius: 4,
                        color: '#fff',
                        cursor: 'pointer',
                        maxWidth: 130,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 4
                      }}
                      title={typeof currentAnimLabel === 'string' ? currentAnimLabel : undefined}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🎬 {currentAnimLabel}
                      </span>
                      <span style={{ fontSize: 8, opacity: 0.8 }}>{showAnimSelector ? '▲' : '▼'}</span>
                    </button>
                  ) : (
                    <select value={actionStates.walkerAnim || 'idle'} onChange={e => setActionStates(s => ({ ...s, walkerAnim: e.target.value }))} style={{ padding: '2px 4px', fontSize: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid #555', borderRadius: 4, color: '#fff', outline: 'none', maxWidth: 120 }}>
                      {['ushiro', 'shiba-inu'].includes(item.id) ? (
                        <>
                          <option value="idle">Idle</option>
                          <option value="jump">Jump</option>
                          <option value="run">Run</option>
                          <option value="sitdown">SitDown</option>
                          <option value="walk">Walk</option>
                        </>
                      ) : item.id === 'robin-bird' ? (
                        <>
                          <option value="Robin_Bird_Idle">Idle</option>
                          <option value="Robin_Bird_Idle2">Idle 2</option>
                          <option value="Robin_Bird_Walk">Walk</option>
                          <option value="Robin_Bird_WalkBack">Walk Back</option>
                          <option value="Robin_Bird_Fly">Fly</option>
                          <option value="Robin_Bird_Eat">Eat</option>
                          <option value="Robin_Bird_Eat2">Eat 2</option>
                          <option value="Robin_Bird_Eat3">Eat 3</option>
                          <option value="Robin_Bird_Call">Call</option>
                          <option value="Robin_Bird_Call2">Call 2</option>
                          <option value="Robin_Bird_Hit">Hit</option>
                          <option value="Robin_Bird_Die">Die</option>
                        </>
                      ) : (
                        <>
                          <option value="tpose">T-Pose (Rest)</option>
                          <option value="idle">Idle</option>
                          <option value="walk">Walking</option>
                          <option value="run">Running</option>
                        </>
                      )}
                    </select>
                  )}

                  {/* Sélecteur et Contrôles Animations de Duo directement dans la preview 3D */}
                  {isHumanWalker && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        <select
                          value={actionStates.duoAnimDef?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setActionStates(s => ({ ...s, duoAnimDef: undefined, walkerAnim: 'idle' }));
                            } else {
                              const def = DUO_ANIMATIONS.find(a => a.id === val);
                              const otherChars = CHARACTERS.filter(c => c.id !== item.id);
                              const defaultPartner = actionStates.duoPartnerId || (otherChars[0]?.id ?? 'rosanna');
                              setActionStates(s => ({
                                ...s,
                                duoAnimDef: def,
                                duoPartnerId: defaultPartner,
                                isPaused: false,
                                walkerAnim: undefined
                              }));
                            }
                          }}
                          style={{
                            padding: '3px 6px',
                            fontSize: 10,
                            fontWeight: actionStates.duoAnimDef ? 'bold' : 'normal',
                            background: actionStates.duoAnimDef ? '#0284c7' : 'rgba(0,0,0,0.7)',
                            border: `1px solid ${actionStates.duoAnimDef ? '#38bdf8' : '#555'}`,
                            borderRadius: 4,
                            color: '#fff',
                            outline: 'none',
                            maxWidth: 130
                          }}
                          title="Sélectionner une animation de couple (Duo)"
                        >
                          <option value="">👯‍♀️ Mode Duo...</option>
                          {DUO_ANIMATIONS.map(a => (
                            <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const randomAnim = DUO_ANIMATIONS[Math.floor(Math.random() * DUO_ANIMATIONS.length)];
                            const otherChars = CHARACTERS.filter(c => c.id !== item.id);
                            const randChar = otherChars[Math.floor(Math.random() * otherChars.length)];
                            if (randomAnim && randChar) {
                              setActionStates(s => ({
                                ...s,
                                duoAnimDef: randomAnim,
                                duoPartnerId: randChar.id,
                                isPaused: false,
                                walkerAnim: undefined
                              }));
                            }
                          }}
                          style={{ padding: '3px 6px', fontSize: 10, background: '#ffc107', color: '#000', border: '1px solid #d39e00', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                          title="Animation Duo + Partenaire aléatoires 🎲"
                        >
                          🎲
                        </button>
                      </div>

                      {actionStates.duoAnimDef && (
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          <select
                            value={actionStates.duoPartnerId || (item.id === 'native' ? 'rosanna' : 'native')}
                            onChange={(e) => {
                              const partnerId = e.target.value;
                              setActionStates(s => ({ ...s, duoPartnerId: partnerId }));
                            }}
                            style={{
                              padding: '2px 4px',
                              fontSize: 10,
                              background: 'rgba(0,0,0,0.75)',
                              border: '1px solid #0284c7',
                              borderRadius: 4,
                              color: '#fff',
                              outline: 'none',
                              maxWidth: 110
                            }}
                            title="Changer le partenaire (Rôle B)"
                          >
                            {CHARACTERS.filter(c => c.id !== item.id).map(c => (
                              <option key={c.id} value={c.id}>B: {c.name}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              const otherChars = CHARACTERS.filter(c => c.id !== item.id);
                              const randChar = otherChars[Math.floor(Math.random() * otherChars.length)];
                              if (randChar) {
                                setActionStates(s => ({ ...s, duoPartnerId: randChar.id }));
                              }
                            }}
                            style={{ padding: '2px 5px', fontSize: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid #777', color: '#ffc107', borderRadius: 4, cursor: 'pointer' }}
                            title="Changer de partenaire au hasard 🎲"
                          >
                            👤🎲
                          </button>

                          <button
                            type="button"
                            onClick={() => setActionStates(s => ({ ...s, duoAnimDef: undefined, walkerAnim: 'idle' }))}
                            style={{ padding: '2px 5px', fontSize: 10, background: '#6c757d', border: '1px solid #545b62', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
                            title="Quitter le mode duo"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!['ushiro', 'shiba-inu', 'robin-bird'].includes(item.id) && (
                    <>
                      <select value={actionStates.previewHaircut || 'original'} onChange={e => setActionStates(s => ({ ...s, previewHaircut: e.target.value }))} style={{ padding: '2px 4px', fontSize: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid #555', borderRadius: 4, color: '#fff', outline: 'none', maxWidth: 120, marginTop: 4 }}>
                        <option value="original">Coupe d'origine</option>
                        {WIGS_ITEMS.map(wig => (
                          <option key={wig.id} value={wig.id}>{wig.name}</option>
                        ))}
                      </select>

                      <select value={actionStates.previewHairColor || 'rose'} onChange={e => setActionStates(s => ({ ...s, previewHairColor: e.target.value }))} style={{ padding: '2px 4px', fontSize: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid #555', borderRadius: 4, color: '#fff', outline: 'none', maxWidth: 120, marginTop: 4 }}>
                        <option value="rose">Rose</option>
                        <option value="naturel">Naturel</option>
                        <option value="noir">Noir</option>
                        <option value="brun">Brun</option>
                        <option value="chatain">Châtain</option>
                        <option value="blond">Blond</option>
                        <option value="roux">Roux</option>
                        <option value="rouge">Rouge</option>
                        <option value="bleu">Bleu</option>
                        <option value="vert">Vert</option>
                        <option value="violet">Violet</option>
                        <option value="arc-en-ciel">Arc-en-ciel</option>
                      </select>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {actionStates.duoAnimDef && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                zIndex: 4,
                background: 'rgba(2, 132, 199, 0.88)',
                backdropFilter: 'blur(4px)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                pointerEvents: 'none'
              }}
            >
              <span className="text-truncate">
                👯‍♀️ <strong>{actionStates.duoAnimDef.icon} {actionStates.duoAnimDef.label}</strong>
              </span>
              <span style={{ fontSize: 10, opacity: 0.9, whiteSpace: 'nowrap', marginLeft: 8 }}>
                A: {(item as any).name} | B: {CHARACTERS.find(c => c.id === (actionStates.duoPartnerId || (item.id === 'native' ? 'rosanna' : 'native')))?.name || actionStates.duoPartnerId}
              </span>
            </div>
          )}

          {/* Modal / Tiroir de sélection d'animations pour personnages humains */}
          {showAnimSelector && isHumanWalker && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: hideFooter ? 8 : 42,
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={e => e.stopPropagation()}
            >
              <CharacterAnimSelector
                activeAnimValue={actionStates.walkerAnim || 'idle'}
                onSelectAnim={(val) => {
                  setActionStates(s => ({ ...s, walkerAnim: val }));
                  setShowAnimSelector(false);
                }}
                onClose={() => setShowAnimSelector(false)}
                title={`Animations (${item.name})`}
                maxHeight="100%"
                listMaxHeight="none"
                autoFocus={true}
              />
            </div>
          )}

          {showing3D && actionKeys.length > 0 && (
            <div style={{ position: 'absolute', top: 40, right: 8, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {actionKeys.map(key => {
                const labels = ACTION_LABELS[key] ?? ['Ouvrir', 'Fermer'], on = !!actionStates[key];
                return <button key={key} onClick={() => setActionStates(s => ({ ...s, [key]: !on }))} style={{ padding: '3px 8px', fontSize: 11, background: on ? '#0058a3' : 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>{on ? labels[1] : labels[0]}</button>;
              })}
            </div>
          )}

          {/* Debug URLs Overlay */}
          <div style={{ position: 'absolute', bottom: hideFooter ? 4 : 40, left: 8, zIndex: 3, fontSize: 9, opacity: 0.5, color: '#222', textShadow: '0 0 2px rgba(255,255,255,0.8)', pointerEvents: 'none', whiteSpace: 'nowrap', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }} title={`${glbPath || 'No GLB'} | ${photos ? photos.join(', ') : 'No photos'}`}>
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
    {item && hasPhotos && (
      <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '8px', scrollbarWidth: 'thin', width: '100%', background: '#eaeaea' }}>
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
