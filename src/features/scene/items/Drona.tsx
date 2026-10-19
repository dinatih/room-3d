/**
 * Drona.tsx — Boîte de rangement IKEA DRONA.
 * Coordonnées locales : centré par bbox, Y=0 = sol, rouge.
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 *
 * Supporte 4 modes (commutable via useSceneStore / Calques) :
 *   - 'high'       : modèle officiel IKEA d'origine (~45k tris / boîte)
 *   - 'low'        : modèle décimé (~1.6k tris / boîte)
 *   - 'procedural' : BoxGeometry Three.js légère (~12 tris / boîte)
 *   - 'hidden'     : boîtes complètement masquées (0 tris)
 *
 * Exports :
 *   DF             — dimension standard d'une boîte DRONA (33 cm)
 *   Drona          — composant SceneItemProps (instance unique, inventaire)
 *   useDronaGeo    — hook retournant la géométrie active selon le mode sélectionné
 *   DroneCell      — boîte unique pour groupes positionnés
 *   DronaInstances — N boîtes via InstancedMesh, prend un tableau de Matrix4
 */
import { Suspense, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneItemProps } from '@shared/types';
import { useSceneStore } from '../store/useSceneStore';

/** Dimension standard d'une boîte DRONA (largeur / hauteur) en cm */
export const DF = 33;

const GLB_DRONA_HIGH = 'items/dröna/DRÖNA_high.glb';
const GLB_DRONA_LOW  = 'items/dröna/DRÖNA_low.glb';
const preparedGeometries = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
let proceduralGeometry: THREE.BufferGeometry | undefined;

const dronaMat = new THREE.MeshStandardMaterial({ 
  color: 0xcc0000, 
  roughness: 0.8, 
  side: THREE.DoubleSide,
});

function createProceduralDronaGeo(): THREE.BufferGeometry {
  // Dimensions DRONA : 33 x 38 x 33 cm (Largeur x Profondeur x Hauteur)
  // L'orientation standard : X=33, Y=33, Z=38
  const geo = new THREE.BoxGeometry(DF, DF, 38);
  // Décalage pour avoir l'origine au centre au niveau du sol (Y=0)
  geo.translate(0, DF / 2, 0);
  return geo;
}

function prepareDronaGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const cached = preparedGeometries.get(source);
  if (cached) return cached;
  const geo = source.clone();

  // Preserve the GLB's existing scale, orientation and centering exactly.
  const scale = 99.5;
  geo.applyMatrix4(new THREE.Matrix4().makeScale(scale, scale, scale));
  geo.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
  const box = new THREE.Box3().setFromBufferAttribute(
    geo.getAttribute('position') as THREE.BufferAttribute
  );
  const center = box.getCenter(new THREE.Vector3());
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));

  preparedGeometries.set(source, geo);
  return geo;
}

/**
 * Retourne la géométrie BufferGeometry de la boîte DRONA selon le mode actif ('high' | 'low' | 'procedural').
 */
export function useDronaGeo(): THREE.BufferGeometry {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  // Keep the hook unconditional while loading only the selected GLB. Hidden
  // inventory items retain the high model's measurement, as before.
  const models = useGLTF(mode === 'procedural' ? [] : [mode === 'low' ? GLB_DRONA_LOW : GLB_DRONA_HIGH]);
  if (mode === 'procedural') return proceduralGeometry ??= createProceduralDronaGeo();
  const mesh = Object.values(models[0].nodes).find((node): node is THREE.Mesh => (node as THREE.Mesh).isMesh);
  if (!mesh) throw new Error('DRONA: GLB has no mesh');
  return prepareDronaGeometry(mesh.geometry);
}

export function Drona({ onSize }: SceneItemProps) {
  return <Suspense fallback={null}><DronaContent onSize={onSize} /></Suspense>;
}

function DronaContent({ onSize }: Pick<SceneItemProps, 'onSize'>) {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  const geo = useDronaGeo();

  useLayoutEffect(() => {
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    if (geo.boundingBox) {
      geo.boundingBox.getSize(size);
    }
    onSize(size);
  }, [geo, onSize]);

  if (mode === 'hidden') return null;
  return <mesh key={mode} geometry={geo} material={dronaMat} dispose={null} castShadow receiveShadow />;
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  return <Suspense fallback={null}><DroneCellContent /></Suspense>;
}

function DroneCellContent() {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  const geo = useDronaGeo();
  if (mode === 'hidden') return null;
  return <mesh key={mode} geometry={geo} material={dronaMat} dispose={null} castShadow receiveShadow userData={{ skipMerge: true }} />;
}

/** N boîtes Drona via InstancedMesh. Chaque Matrix4 encode position + rotation. */
export function DronaInstances({ matrices }: { matrices: THREE.Matrix4[] }) {
  return <Suspense fallback={null}><DronaInstancesContent matrices={matrices} /></Suspense>;
}

function DronaInstancesContent({ matrices }: { matrices: THREE.Matrix4[] }) {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  const geo = useDronaGeo();
  const N = matrices.length;
  const apply = (mesh: THREE.InstancedMesh) => {
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };
  if (mode === 'hidden') return null;
  return <instancedMesh key={mode} args={[geo, dronaMat, N]} castShadow receiveShadow onUpdate={apply} />;
}

