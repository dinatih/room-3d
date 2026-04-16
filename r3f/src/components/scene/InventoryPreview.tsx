/**
 * InventoryPreview.tsx — panneau de prévisualisation 3D pour l'inventaire.
 * Charge les GLB de façon impérative (pas de cache useGLTF) pour obtenir une
 * scène vierge, sans les transforms baked par les composants de la scène principale.
 */
import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { type InventoryItem, type StorageSpace } from './inventoryData';
import { SCENE_REGISTRY, ACTION_LABELS } from './registry';
import type { SceneItemProps } from '../../types';

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
  'door-glass':             'door-toggle',
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

// ── Box scene (fallback) ──────────────────────────────────────────────────────

function BoxScene({ dims }: { dims: { w: number; d: number; h: number } }) {
  const maxDim = Math.max(dims.w, dims.d, dims.h, 0.001);
  return (
    <mesh>
      <boxGeometry args={[(dims.w / maxDim) * 1.6, (dims.h / maxDim) * 1.6, (dims.d / maxDim) * 1.6]} />
      <meshStandardMaterial color="#4488ff" roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

// ── Registry scene — composant items/, centré par bbox ───────────────────────

function CenteredItem({
  Component, actionState, item,
}: {
  Component: React.ComponentType<SceneItemProps>;
  actionState: Record<string, boolean>;
  item?: any;
}) {
  const outerRef = useRef<THREE.Group>(null!);
  const innerRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    innerRef.current.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(innerRef.current);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return;
    const s = 1.4 / maxDim;
    outerRef.current.scale.setScalar(s);
    outerRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
  }, []);

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>
        <Component item={item ?? {} as any} actionState={actionState} onSize={() => {}} />
      </group>
    </group>
  );
}

function RegistryScene({
  item, actionState,
}: {
  item: InventoryItem;
  actionState: Record<string, boolean>;
}) {
  const Component = SCENE_REGISTRY[item.id];
  if (!Component) return null;
  return <CenteredItem Component={Component} actionState={actionState} item={item} />;
}

// ── Main export ───────────────────────────────────────────────────────────────

type PreviewTarget = InventoryItem | StorageSpace | null;

export function InventoryPreview({ item }: { item: PreviewTarget }) {
  const glbPath = item && 'glbPath' in item ? item.glbPath : undefined;
  const dims    = item?.dims;

  const actionKey   = item ? ITEM_ACTIONS[item.id] : undefined;
  const actionState = actionKey ? { [actionKey]: false } : {};  // mis à jour ci-dessous

  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { setIsOpen(false); }, [item?.id]);

  const liveActionState = actionKey ? { [actionKey]: isOpen } : {};
  const labels = actionKey ? (ACTION_LABELS[actionKey] ?? ['Ouvrir', 'Fermer']) : null;

  return (
    <div style={{
      width: 260, minWidth: 260, height: 320,
      background: '#0d0d18',
      borderRadius: 8,
      border: '1px solid #2a2a40',
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
          <Canvas
            key={glbPath ?? item.id}
            frameloop="always"
            camera={{ fov: 45, near: 0.01, far: 100, position: [1.4, 0.9, 1.8] }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ scene }) => { scene.background = new THREE.Color(0x0d0d18); }}
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
              maxDistance={10}
              target={[0, 0, 0]}
            />

            {glbPath
              ? <GlbScene glbPath={glbPath} />
              : SCENE_REGISTRY[item.id]
                ? <RegistryScene item={item as InventoryItem} actionState={liveActionState} />
                : dims ? <BoxScene dims={dims} /> : null
            }
          </Canvas>

          {labels && (
            <button
              onClick={() => setIsOpen(o => !o)}
              style={{
                position: 'absolute', top: 8, right: 8,
                padding: '3px 8px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                border: '1px solid #444',
                borderRadius: 4,
                color: '#ccc', fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {isOpen ? labels[1] : labels[0]}
            </button>
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
            {dims && (
              <span style={{ color: '#555', marginLeft: 6, fontFamily: 'monospace', fontSize: 10 }}>
                {dims.w}×{dims.d}×{dims.h} cm
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
