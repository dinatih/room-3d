/**
 * InventoryPreview.tsx — panneau de prévisualisation 3D pour l'inventaire.
 * Charge les GLB de façon impérative (pas de cache useGLTF) pour obtenir une
 * scène vierge, sans les transforms baked par les composants de la scène principale.
 */
import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { type InventoryItem, type StorageSpace } from './inventoryData';
import { SCENE_REGISTRY, ACTION_LABELS } from './previewRegistry';
import type { SceneItemProps } from '@shared/types';

// DRACOLoader partagé (même path que drei)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

// ── Action key par item.id ────────────────────────────────────────────────────

const ITEM_ACTIONS: Record<string, string> = {
  'freezer':                'freezer-toggle',
  'fridge':                 'fridge-toggle',
  'cabinet-wood':           'cabinet-toggle',
  'bathroom-cabinet-west':  'cbn-west-toggle',
  'bathroom-cabinet-east':  'cbn-east-toggle',
  'door-entry':             'entry-door-toggle',
  'door-living':            'living-door-toggle',
  'door-sdb':               'bathroom-door-toggle',
  'door-glass':             'east-glass-door-toggle',
  'toilet':                 'wc-lid-toggle',
  'corridor-closet':        'corr-doors-toggle',
  'ninja-sp101':            'ninja-toggle',
};

// ── Camera fit ────────────────────────────────────────────────────────────────

function FitCamera() {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    camera.position.set(1.4, 0.9, 1.8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, []);
  return null;
}

// ── GLB scene — chargement impératif ─────────────────────────────────────────

function GlbScene({ glbPath }: { glbPath: string }) {
  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(glbPath, (gltf) => {
      if (cancelled || !groupRef.current) return;
      const obj = gltf.scene;

      const g = groupRef.current;
      while (g.children.length) g.remove(g.children[0]);
      g.scale.set(1, 1, 1);
      g.position.set(0, 0, 0);

      g.add(obj);
      g.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim === 0) return;

      obj.position.sub(center);
      g.scale.setScalar(1.4 / maxDim);
    });

    return () => { cancelled = true; };
  }, [glbPath]);

  return <group ref={groupRef} />;
}

// ── Registry scene — composant items/, centré par bbox ───────────────────────

function CenteredItem({
  Component, actionState, item,
}: {
  Component: React.ComponentType<SceneItemProps>;
  actionState: Record<string, any>;
  item?: any;
}) {
  const outerRef = useRef<THREE.Group>(null!);
  const innerRef = useRef<THREE.Group>(null!);

  const fit = useCallback((_size: THREE.Vector3) => {
    if (!outerRef.current || !innerRef.current) return;
    // Mesure en espace local : annule scale/position outerRef avant setFromObject
    outerRef.current.scale.set(1, 1, 1);
    outerRef.current.position.set(0, 0, 0);
    outerRef.current.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(innerRef.current);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const localSize = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(localSize.x, localSize.y, localSize.z);
    if (maxDim === 0) return;
    const s = 1.4 / maxDim;
    outerRef.current.scale.setScalar(s);
    outerRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
  }, []);

  // Fit unique au montage (Canvas key=item.id remount au changement d'objet).
  // Pas de re-fit sur actionState — évite saut de scale visible quand bbox change.
  useEffect(() => {
    fit(new THREE.Vector3());
  }, [fit]);

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>
        <Component item={item ?? {} as any} actionState={actionState} onSize={fit} />
      </group>
    </group>
  );
}

function RegistryScene({
  item, actionState,
}: {
  item: InventoryItem;
  actionState: Record<string, any>;
}) {
  const Component = SCENE_REGISTRY[item.id];
  if (!Component) return null;
  return <CenteredItem Component={Component} actionState={actionState} item={item} />;
}

// ── Photo gallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={photos[idx]}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', padding: '6px 9px', fontSize: 16, lineHeight: 1 }}
          >‹</button>
          <button
            onClick={() => setIdx(i => (i + 1) % photos.length)}
            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', padding: '6px 9px', fontSize: 16, lineHeight: 1 }}
          >›</button>
          <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#666', pointerEvents: 'none' }}>
            {idx + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type PreviewTarget = InventoryItem | StorageSpace | null;

export function InventoryPreview({ item }: { item: PreviewTarget }) {
  const glbPath   = item && 'glbPath' in item ? item.glbPath   : undefined;
  const photos    = item && 'photos'  in item ? (item as InventoryItem).photos : undefined;

  const hasRegistry = item ? !!SCENE_REGISTRY[item.id] : false;
  const has3D       = hasRegistry || !!glbPath;
  const hasPhotos   = !!photos?.length;

  const legacyActionKey = item ? ITEM_ACTIONS[item.id] : undefined;
  const itemActions     = (item && 'actions' in item ? item.actions : undefined) ?? [];
  const actionKeys: string[] = itemActions.length > 0
    ? itemActions
    : legacyActionKey ? [legacyActionKey] : [];

  const [actionStates, setActionStates] = useState<Record<string, any>>({});
  const [viewMode, setViewMode]         = useState<'3d' | 'photos'>('3d');
  useEffect(() => { setActionStates({}); setViewMode('3d'); }, [item?.id]);

  const showing3D     = has3D && (!hasPhotos || viewMode === '3d');
  const showingPhotos = hasPhotos && (!has3D   || viewMode === 'photos');

  return (
    <div style={{
      width: 260, minWidth: 260, height: 320,
      background: '#ffffff',
      borderRadius: 8,
      border: '1px solid #dde0e8',
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {!item && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#444', fontSize: 12, pointerEvents: 'none',
        }}>
          Sélectionner un objet
        </div>
      )}

      {item && (
        <>
          {/* Tab bar — only when both 3D and photos exist */}
          {has3D && hasPhotos && (
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 3,
              display: 'flex', gap: 3,
            }}>
              {(['3d', 'photos'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '2px 7px', fontSize: 10,
                    background: viewMode === mode ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.35)',
                    border: viewMode === mode ? '1px solid #aaa' : '1px solid transparent',
                    borderRadius: 4, color: '#eee', cursor: 'pointer',
                  }}
                >
                  {mode === '3d' ? '3D' : `📷 ${photos!.length}`}
                </button>
              ))}
            </div>
          )}

          {showing3D ? (
            <Canvas
              key={item.id}
              frameloop="always"
              camera={{ fov: 45, near: 0.01, far: 100, position: [1.4, 0.9, 1.8] }}
              gl={{ antialias: true, alpha: false }}
              onCreated={({ scene }) => { scene.background = new THREE.Color(0xffffff); }}
            >
              <ambientLight intensity={0.8} />
              <directionalLight position={[3, 5, 3]} intensity={1.5} />
              <directionalLight position={[-2, 1, -2]} intensity={0.4} color="#aabbff" />

              <FitCamera />
              <OrbitControls
                autoRotate
                autoRotateSpeed={1.2}
                enablePan={false}
                minDistance={0.3}
                maxDistance={50}
                target={[0, 0, 0]}
              />

              {hasRegistry
                ? <RegistryScene item={item as InventoryItem} actionState={actionStates} />
                : <GlbScene glbPath={glbPath!} />
              }
            </Canvas>
          ) : showingPhotos ? (
            <PhotoGallery key={item.id + '-photos'} photos={photos!} />
          ) : null}

          {showing3D && actionKeys.length > 0 && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {actionKeys.map(key => {
                const labels = ACTION_LABELS[key] ?? ['Ouvrir', 'Fermer'];
                const on = !!actionStates[key];
                return (
                  <button
                    key={key}
                    onClick={() => setActionStates(s => ({ ...s, [key]: !s[key] }))}
                    style={{
                      padding: '3px 8px',
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid #444',
                      borderRadius: 4,
                      color: '#ccc', fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {on ? labels[1] : labels[0]}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            fontSize: 11, color: '#ccc',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            {item.name}
            {item.dims && (
              <span style={{ color: '#555', marginLeft: 6, fontFamily: 'monospace', fontSize: 10 }}>
                {item.dims.w}×{item.dims.d}×{item.dims.h} cm
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
