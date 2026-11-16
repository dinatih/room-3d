/**
 * Drona.tsx — Boîte de rangement IKEA DRONA rouge (33 × 38 × 33 cm).
 * Coordonnées locales : pivot au centre de la boîte sur les trois axes.
 * Le GLB généré par Blender (scripts/generate-drona.py) est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * En mode preview, permet aussi de basculer vers le GLB officiel IKEA pour comparer.
 *
 * Exports :
 *   DF             — dimension standard d'une boîte DRONA (33 cm)
 *   DRONA_DEPTH    — profondeur standard d'une boîte DRONA (38 cm)
 *   DRONA_PANEL    — épaisseur du fond intérieur (0,2 cm)
 *   Drona          — composant SceneItemProps / SceneModelProps
 *   useDronaGeo    — hook retournant la géométrie partagée préparée
 *   DroneCell      — boîte unique pour groupes positionnés
 */
import { Suspense, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneItemProps } from '@shared/types';

/** Dimension standard d'une boîte DRONA (largeur / hauteur) en cm */
export const DF = 33;
export const DRONA_DEPTH = 38;
export const DRONA_PANEL = 0.2;

export type DronaModelVariant = 'blender-red' | 'official-ikea';
type DronaProps = Partial<Pick<SceneItemProps, 'onSize' | 'isPreview' | 'actionState'>>;

const GLB_DRONA = 'items/dröna/DronaRed.glb';
const GLB_DRONA_OFFICIAL = 'items/dröna/DRÖNA_high.glb';

const preparedBlenderGeometries = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
const preparedOfficialGeometries = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

const officialDronaMaterial = new THREE.MeshStandardMaterial({
  color: 0xcc0000,
  roughness: 0.8,
  side: THREE.DoubleSide,
});

function prepareGlbGeometry(
  source: THREE.BufferGeometry,
  cache: WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>,
  scale: number,
  rotateY = 0
): THREE.BufferGeometry {
  const cached = cache.get(source);
  if (cached) return cached;
  const geo = source.clone();
  geo.scale(scale, scale, scale);
  if (rotateY) geo.rotateY(rotateY);
  geo.center();
  geo.computeBoundingBox();
  cache.set(source, geo);
  return geo;
}

function useDronaAsset(): { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] } {
  const { nodes } = useGLTF(GLB_DRONA);
  const mesh = Object.values(nodes).find((node): node is THREE.Mesh => (node as THREE.Mesh).isMesh);
  if (!mesh) throw new Error('DRONA: GLB has no mesh');
  return {
    geometry: prepareGlbGeometry(mesh.geometry, preparedBlenderGeometries, 100),
    material: mesh.material,
  };
}

function useOfficialDronaGeo(): THREE.BufferGeometry {
  const { nodes } = useGLTF(GLB_DRONA_OFFICIAL);
  const mesh = Object.values(nodes).find((node): node is THREE.Mesh => (node as THREE.Mesh).isMesh);
  if (!mesh) throw new Error('DRONA official: GLB has no mesh');
  return prepareGlbGeometry(mesh.geometry, preparedOfficialGeometries, 99.5, Math.PI / 2);
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

  return (
    <mesh
      geometry={geometry}
      material={material}
      dispose={null}
      castShadow
      receiveShadow
      userData={{ skipMerge: true, previewGlbPath: GLB_DRONA }}
    />
  );
}

function OfficialDronaMesh({ onSize }: { onSize?: (size: THREE.Vector3) => void }) {
  const geometry = useOfficialDronaGeo();

  useLayoutEffect(() => {
    onSize?.(geometry.boundingBox!.getSize(new THREE.Vector3()));
  }, [geometry, onSize]);

  return (
    <mesh
      geometry={geometry}
      material={officialDronaMaterial}
      dispose={null}
      castShadow
      receiveShadow
      userData={{ skipMerge: true, previewGlbPath: GLB_DRONA_OFFICIAL }}
    />
  );
}

export function Drona({ onSize, isPreview, actionState }: DronaProps) {
  const variant: DronaModelVariant = isPreview && actionState?.['drona-model-variant'] === 'official-ikea'
    ? 'official-ikea'
    : 'blender-red';
  return (
    <Suspense fallback={null}>
      {variant === 'official-ikea' ? <OfficialDronaMesh onSize={onSize} /> : <DronaMesh onSize={onSize} />}
    </Suspense>
  );
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  return <Suspense fallback={null}><DronaMesh /></Suspense>;
}

useGLTF.preload(GLB_DRONA);
