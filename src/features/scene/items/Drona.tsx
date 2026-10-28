/**
 * Drona.tsx — Boîte de rangement IKEA DRONA.
 * Coordonnées locales : pivot au centre de la boîte sur les trois axes, rouge.
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
 *   Drona          — composant SceneModelProps (instance unique, inventaire)
 *   useDronaGeo    — hook retournant la géométrie active selon le mode sélectionné
 *   DroneCell      — boîte unique pour groupes positionnés
 */
import { Suspense, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneModelProps } from '@shared/types';
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
  geo.computeBoundingBox();
  return geo;
}

function prepareDronaGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const cached = preparedGeometries.get(source);
  if (cached) return cached;
  const geo = source.clone();

  // Preserve the GLB's existing scale, orientation and centering exactly.
  geo.scale(99.5, 99.5, 99.5);
  geo.rotateY(Math.PI / 2);
  geo.center();

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

export function Drona({ onSize }: SceneModelProps) {
  return <Suspense fallback={null}><DronaContent onSize={onSize} /></Suspense>;
}

function DronaContent({ onSize }: SceneModelProps) {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  const geo = useDronaGeo();

  useLayoutEffect(() => {
    onSize?.(geo.boundingBox!.getSize(new THREE.Vector3()));
  }, [geo, onSize]);

  if (mode === 'hidden') return null;
  return <mesh key={mode} geometry={geo} material={dronaMat} dispose={null} castShadow receiveShadow userData={{ skipMerge: true }} />;
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  return <Suspense fallback={null}><DronaContent /></Suspense>;
}
