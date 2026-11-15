/**
 * Drona.tsx — Boîte de rangement IKEA DRONA rouge (33 × 38 × 33 cm).
 * Coordonnées locales : pivot au centre de la boîte sur les trois axes.
 * Le GLB généré par Blender (scripts/generate-drona.py) est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 *
 * Exports :
 *   DF             — dimension standard d'une boîte DRONA (33 cm)
 *   DRONA_DEPTH    — profondeur standard d'une boîte DRONA (38 cm)
 *   DRONA_PANEL    — épaisseur du fond intérieur (0,2 cm)
 *   Drona          — composant SceneModelProps (instance unique)
 *   useDronaGeo    — hook retournant la géométrie partagée préparée
 *   DroneCell      — boîte unique pour groupes positionnés
 */
import { Suspense, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneModelProps } from '@shared/types';

/** Dimension standard d'une boîte DRONA (largeur / hauteur) en cm */
export const DF = 33;
export const DRONA_DEPTH = 38;
export const DRONA_PANEL = 0.2;

const GLB_DRONA = 'items/dröna/DronaRed.glb';
const preparedGeometries = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

function prepareDronaGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const cached = preparedGeometries.get(source);
  if (cached) return cached;
  const geo = source.clone();
  geo.scale(100, 100, 100);
  geo.center();
  geo.computeBoundingBox();
  preparedGeometries.set(source, geo);
  return geo;
}

function useDronaAsset(): { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] } {
  const { nodes } = useGLTF(GLB_DRONA);
  const mesh = Object.values(nodes).find((node): node is THREE.Mesh => (node as THREE.Mesh).isMesh);
  if (!mesh) throw new Error('DRONA: GLB has no mesh');
  return {
    geometry: prepareDronaGeometry(mesh.geometry),
    material: mesh.material,
  };
}

/** Géométrie préparée une seule fois et partagée entre les boîtes. */
export function useDronaGeo(): THREE.BufferGeometry {
  return useDronaAsset().geometry;
}

function DronaMesh({ onSize }: { onSize?: (size: THREE.Vector3) => void }) {
  const { geometry, material } = useDronaAsset();

  useLayoutEffect(() => {
    onSize?.(geometry.boundingBox!.getSize(new THREE.Vector3()));
  }, [geometry, onSize]);

  return <mesh geometry={geometry} material={material} dispose={null} castShadow receiveShadow userData={{ skipMerge: true }} />;
}

export function Drona({ onSize }: SceneModelProps) {
  return <Suspense fallback={null}><DronaMesh onSize={onSize} /></Suspense>;
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  return <Suspense fallback={null}><DronaMesh /></Suspense>;
}

useGLTF.preload(GLB_DRONA);
