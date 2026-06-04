import { useState, useRef, useLayoutEffect, useCallback, useEffect, Suspense, useMemo, type ComponentType } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { type InventoryItem, type StorageSpace } from './inventoryData';
import { SCENE_REGISTRY, ACTION_LABELS } from './previewRegistry';

import { glbLocalBBox } from '@features/scene/glbUtils';

function GlbScene({ glbPath, onSize }: { glbPath: string; onSize?: () => void; }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  useEffect(() => {
    const draco = new DRACOLoader(); draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    loader.load(glbPath, gltf => {
      setScene(gltf.scene);
    });
  }, [glbPath]);

  useLayoutEffect(() => {
    if (scene) onSize?.();
  }, [scene, onSize]);

  if (!scene) return null; return <primitive object={scene} />;
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

function FitCamera() { const { camera } = useThree(); useLayoutEffect(() => { camera.lookAt(0, 0, 0); }, [camera]); return null; }

function CenteredItem({ Component, actionState, item, grounded = false, preserveOriginXZ = false, showDims = false, glbPath }: { Component?: any; actionState: Record<string, any>; item: PreviewTarget; grounded?: boolean; preserveOriginXZ?: boolean; showDims?: boolean; glbPath?: string; }) {
  const outerRef = useRef<THREE.Group>(null!), innerRef = useRef<THREE.Group>(null!), [scale, setScale] = useState(1);
  const [worldSize, setWorldSize] = useState<{ x: number; y: number; z: number } | null>(null);

  const fit = useCallback(() => {
    if (!outerRef.current || !innerRef.current) return;
    outerRef.current.scale.set(1, 1, 1); outerRef.current.position.set(0, 0, 0); outerRef.current.updateMatrixWorld(true);
    
    // Temporarily hide helpers/GroundPoint to get true model dimensions
    const hidden: THREE.Object3D[] = [];
    innerRef.current.traverse(o => { 
      if (o.visible && (o.type.includes('Helper') || o.name === 'GroundPoint')) { 
        o.visible = false; hidden.push(o); 
      } 
    });
    
    const box = new THREE.Box3().setFromObject(innerRef.current);
    hidden.forEach(o => o.visible = true);

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
  }, [grounded, preserveOriginXZ]);

  useLayoutEffect(() => {
    // Small delay to ensure skeleton/skinning matrices are computed
    const timer = setTimeout(fit, 50);
    return () => clearTimeout(timer);
  }, [fit, item?.id, glbPath, actionState]);

  return (
    <group>
      <group ref={outerRef}>
        <group ref={innerRef}>
          {Component ? <Component item={item ?? {} as any} actionState={actionState} onSize={fit} /> : <GlbScene glbPath={glbPath!} onSize={fit} />}
        </group>
      </group>
      {showDims && item?.dims && worldSize && <Dimensions dims={item.dims} worldSize={worldSize} grounded={grounded} />}
    </group>
  );
}

function RegistryScene({ item, actionState, showDims }: { item: InventoryItem; actionState: Record<string, any>; showDims: boolean; }) {
  const Component = SCENE_REGISTRY[item.id], isWalker = item.category === 'walkers';
  return <CenteredItem Component={Component} actionState={actionState} item={item} grounded={true} preserveOriginXZ={isWalker} showDims={showDims} glbPath={item.glbPath} />;
}

function PhotoGallery({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={photos[idx]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
      {photos.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', padding: '6px 9px', fontSize: 16, lineHeight: 1 }}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % photos.length)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', padding: '6px 9px', fontSize: 16, lineHeight: 1 }}>›</button>
          <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#666', pointerEvents: 'none' }}>{idx + 1} / {photos.length}</div>
        </>
      )}
    </div>
  );
}

type PreviewTarget = InventoryItem | StorageSpace | null;

export function InventoryPreview({ item }: { item: PreviewTarget }) {
  const glbPath = item && 'glbPath' in item ? item.glbPath : undefined, photos = item && 'photos' in item ? (item as InventoryItem).photos : undefined;
  const hasRegistry = item ? !!SCENE_REGISTRY[item.id] : false, has3D = !!glbPath || hasRegistry, hasPhotos = !!photos && photos.length > 0;
  const actionKeys = item && 'category' in item && (item as InventoryItem).category === 'walkers' ? [] : (item as any)?.actions?.[0] ? [(item as any).actions[0]] : [];
  const [actionStates, setActionStates] = useState<Record<string, any>>({}), [viewMode, setViewMode] = useState<'3d' | 'photos'>('3d'), [showDims, setShowDims] = useState(true), [autoRotate, setAutoRotate] = useState(true);
  useEffect(() => { setActionStates({}); setViewMode('3d'); setAutoRotate(true); }, [item?.id]);
  const showing3D = has3D && (!hasPhotos || viewMode === '3d'), showingPhotos = hasPhotos && (!has3D || viewMode === 'photos');

  return (
    <div style={{ width: 520, minWidth: 520, height: 640, background: '#d2d2d2', borderRadius: 8, border: '1px solid #dde0e8', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
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
            <Canvas key={item.id} frameloop="always" camera={{ fov: 45, near: 0.01, far: 100, position: [1.4, 0.9, 1.8] }} gl={{ antialias: true, alpha: false }} onCreated={({ scene }) => { scene.background = new THREE.Color('#d2d2d2'); scene.fog = new THREE.Fog('#d2d2d2', 4, 15); }}>
              <ambientLight intensity={1.2} />
              <directionalLight position={[3, 5, 3]} intensity={1.5} />
              <directionalLight position={[-2, 1, -2]} intensity={0.5} color="#aabbff" />
              <FitCamera />
              <OrbitControls autoRotate={autoRotate} autoRotateSpeed={1.2} enablePan={false} minDistance={0.3} maxDistance={50} target={[0, 0, 0]} onStart={() => setAutoRotate(false)} />
              <Grid infiniteGrid fadeDistance={15} cellColor="#999999" sectionColor="#666666" cellSize={0.2} sectionSize={1} position={[0, -0.001, 0]} />
              <Suspense fallback={null}><RegistryScene item={item as InventoryItem} actionState={actionStates} showDims={showDims} /></Suspense>
            </Canvas>
          ) : showingPhotos ? <PhotoGallery key={item.id + '-photos'} photos={photos!} /> : null}
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={() => setShowDims(v => !v)} style={{ padding: '3px 8px', fontSize: 11, background: 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>📏 {showDims ? 'Masquer Dims' : 'Afficher Dims'}</button>
          </div>
          {showing3D && 'category' in item && (item as any).category === 'walkers' && (
            <div style={{ position: 'absolute', top: 40, left: 8, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => setActionStates(s => ({ ...s, showBones: !s.showBones }))} style={{ padding: '3px 8px', fontSize: 11, background: actionStates.showBones ? '#0058a3' : 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>{actionStates.showBones ? '🦴 Cacher Squelette' : '🦴 Voir Squelette'}</button>
              <button onClick={() => setActionStates(s => ({ ...s, isPaused: !s.isPaused }))} style={{ padding: '3px 8px', fontSize: 11, background: actionStates.isPaused ? '#e63946' : 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>{actionStates.isPaused ? '▶️ Play' : '⏸️ Pause'}</button>
              <button onClick={() => setActionStates(s => ({ ...s, walkerAnim: 'tpose' }))} style={{ padding: '3px 8px', fontSize: 11, background: actionStates.walkerAnim === 'tpose' ? '#2a9d3a' : 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>📐 T-Pose</button>
              <select value={actionStates.walkerAnim || 'idle'} onChange={e => setActionStates(s => ({ ...s, walkerAnim: e.target.value }))} style={{ padding: '2px 4px', fontSize: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid #555', borderRadius: 4, color: '#fff', outline: 'none', maxWidth: 120 }}>
                <option value="tpose">T-Pose (Rest)</option>
                <option value="idle">Idle</option>
                <option value="walk">Walking</option>
                <option value="run">Running</option>
                <option value="agree">Agree</option>
                <option value="headShake">Head Shake</option>
                <option value="sad_pose">Sad Pose</option>
                <option value="sneak_pose">Sneak Pose</option>
              </select>
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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 'bold', fontSize: 12 }}>{item.name}</div><div style={{ opacity: 0.8 }}>{item.dims.w}×{item.dims.d}×{item.dims.h} cm</div></div>
            {item && 'url' in item && (item as InventoryItem).url && <a href={(item as InventoryItem).url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title={(item as InventoryItem).url} style={{ marginLeft: 8, color: '#7ab8ff', textDecoration: 'none', pointerEvents: 'auto' }}>🔗</a>}
          </div>
        </>
      )}
    </div>
  );
}
