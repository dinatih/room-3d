/**
 * Drona.tsx — Boîte de rangement IKEA DRONA.
 * Coordonnées locales : pivot au centre de la boîte sur les trois axes, rouge.
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 *
 * Exports :
 *   DF             — dimension standard d'une boîte DRONA (33 cm)
 *   Drona          — composant SceneModelProps (instance unique, inventaire)
 *   useDronaGeo    — hook retournant la géométrie partagée du modèle officiel
 *   DroneCell      — boîte unique pour groupes positionnés
 */
import { Suspense, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneModelProps } from '@shared/types';

/** Dimension standard d'une boîte DRONA (largeur / hauteur) en cm */
export const DF = 33;

const GLB_DRONA = 'items/dröna/DRÖNA_high.glb';
const preparedGeometries = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

const dronaMat = new THREE.MeshStandardMaterial({ 
  color: 0xcc0000, 
  roughness: 0.8, 
  side: THREE.DoubleSide,
});

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

/** Géométrie officielle préparée une seule fois et partagée entre les boîtes. */
export function useDronaGeo(): THREE.BufferGeometry {
  const { nodes } = useGLTF(GLB_DRONA);
  const mesh = Object.values(nodes).find((node): node is THREE.Mesh => (node as THREE.Mesh).isMesh);
  if (!mesh) throw new Error('DRONA: GLB has no mesh');
  return prepareDronaGeometry(mesh.geometry);
}

export function Drona({ onSize }: SceneModelProps) {
  return <Suspense fallback={null}><DronaContent onSize={onSize} /></Suspense>;
}

function DronaContent({ onSize }: SceneModelProps) {
  const geo = useDronaGeo();

  useLayoutEffect(() => {
    onSize?.(geo.boundingBox!.getSize(new THREE.Vector3()));
  }, [geo, onSize]);

  return <mesh geometry={geo} material={dronaMat} dispose={null} castShadow receiveShadow userData={{ skipMerge: true }} />;
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  return <Suspense fallback={null}><DronaContent /></Suspense>;
}
