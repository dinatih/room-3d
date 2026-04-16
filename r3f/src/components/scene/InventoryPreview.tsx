/**
 * InventoryPreview.tsx — panneau de prévisualisation 3D pour l'inventaire.
 * Charge les GLB de façon impérative (pas de cache useGLTF) pour obtenir une
 * scène vierge, sans les transforms baked par les composants de la scène principale.
 */
import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DoorEntry }          from './items/DoorEntry';
import { DoorLiving, DoorSdb } from './items/DoorWhite';
import { GlassDoor }          from './items/GlassDoor';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { type InventoryItem, type StorageSpace } from './inventoryData';
import type { SceneItemProps } from '../../types';

// DRACOLoader partagé (même path que drei)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

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
      // Vider le groupe et reset sa transform
      while (g.children.length) g.remove(g.children[0]);
      g.scale.set(1, 1, 1);
      g.position.set(0, 0, 0);

      g.add(obj);
      // Forcer le calcul des matrixWorld depuis zéro
      g.updateMatrixWorld(true);

      // Bbox en world-space (g = identité → world = g-local)
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim === 0) return;

      // Centrer obj à l'origine de g, puis scaler g pour tenir en 1.8 unités
      obj.position.sub(center);
      g.scale.setScalar(1.8 / maxDim);
    });

    return () => { cancelled = true; };
  }, [glbPath]);

  return <group ref={groupRef} />;
}

// ── Box scene (pas de GLB) ────────────────────────────────────────────────────

function BoxScene({ dims }: { dims: { w: number; d: number; h: number } }) {
  const maxDim = Math.max(dims.w, dims.d, dims.h, 0.001);
  return (
    <mesh>
      <boxGeometry args={[(dims.w / maxDim) * 1.6, (dims.h / maxDim) * 1.6, (dims.d / maxDim) * 1.6]} />
      <meshStandardMaterial color="#4488ff" roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

// ── Door scene — composants items/ complets, centrés par bbox ─────────────────

type DoorMapEntry = { Component: React.ComponentType<SceneItemProps>; actionKey: string };

const DOOR_MAP: Record<string, DoorMapEntry> = {
  'door-entry':  { Component: DoorEntry,  actionKey: 'entry-door-toggle'    },
  'door-living': { Component: DoorLiving, actionKey: 'living-door-toggle'   },
  'door-sdb':    { Component: DoorSdb,    actionKey: 'bathroom-door-toggle' },
  'door-glass':  { Component: GlassDoor,  actionKey: 'door-toggle'          },
};

function CenteredDoor({
  Component, actionState,
}: {
  Component: React.ComponentType<SceneItemProps>;
  actionState: Record<string, boolean>;
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
    const s = 1.8 / maxDim;
    outerRef.current.scale.setScalar(s);
    outerRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
  }, []);

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>
        <Component item={{} as any} actionState={actionState} onSize={() => {}} />
      </group>
    </group>
  );
}

function DoorScene({
  id, dims, isOpen,
}: {
  id: string; dims: { w: number; d: number; h: number }; isOpen: boolean;
}) {
  const entry = DOOR_MAP[id];
  if (!entry) return <BoxScene dims={dims} />;
  const actionState = { [entry.actionKey]: isOpen };
  return <CenteredDoor Component={entry.Component} actionState={actionState} />;
}

// ── Main export ───────────────────────────────────────────────────────────────

type PreviewTarget = InventoryItem | StorageSpace | null;

export function InventoryPreview({ item }: { item: PreviewTarget }) {
  const glbPath  = item && 'glbPath' in item ? item.glbPath : undefined;
  const category = item && 'category' in item ? (item as InventoryItem).category : undefined;
  const dims     = item?.dims;
  const isDoor   = category === 'doors';
  const hasDoorAction = isDoor && item != null && item.id in DOOR_MAP;

  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { setIsOpen(false); }, [item?.id]);

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
              : isDoor && dims
                ? <DoorScene id={item.id} dims={dims} isOpen={isOpen} />
                : dims ? <BoxScene dims={dims} /> : null
            }
          </Canvas>

          {hasDoorAction && (
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
              {isOpen ? 'Fermer' : 'Ouvrir'}
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
