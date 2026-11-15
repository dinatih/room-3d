/**
 * Drona.tsx — Boîte de rangement IKEA DRONA rouge (33 × 38 × 33 cm).
 * Coordonnées locales : pivot au centre de la boîte sur les trois axes.
 * Le GLB généré par Blender (scripts/generate-drona.py) est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * En mode preview, permet aussi de basculer vers le GLB officiel IKEA et l'ancien maillage procédural low-poly.
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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import type { SceneItemProps } from '@shared/types';

/** Dimension standard d'une boîte DRONA (largeur / hauteur) en cm */
export const DF = 33;
export const DRONA_DEPTH = 38;
export const DRONA_PANEL = 0.2;

export type DronaModelVariant = 'blender-red' | 'official-ikea' | 'low-poly';
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

let lowPolyGeometryCache: THREE.BufferGeometry | null = null;
let lowPolyMaterialCache: THREE.MeshStandardMaterial | null = null;

function createPanel(parts: THREE.BufferGeometry[], w: number, h: number, d: number, x: number, y: number, z: number, tint = 0xffffff) {
  const geometry = new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const color = new THREE.Color(tint);
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const offset = i * 4;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
    colors[offset + 3] = 1;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  parts.push(geometry);
}

function getLowPolyAssets(): { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial } {
  if (!lowPolyGeometryCache) {
    const parts: THREE.BufferGeometry[] = [];
    const PANEL = DRONA_PANEL;
    createPanel(parts, DF, PANEL, DRONA_DEPTH, 0, -DF / 2 + PANEL / 2, 0);
    for (const side of [-1, 1]) {
      createPanel(parts, PANEL, DF - PANEL, DRONA_DEPTH, side * (DF - PANEL) / 2, PANEL / 2, 0);
      createPanel(parts, DF - 2 * PANEL, DF - PANEL, PANEL, 0, PANEL / 2, side * (DRONA_DEPTH - PANEL) / 2);
      createPanel(parts, DF, 0.6, 0.4, 0, (DF - 0.6) / 2, side * (DRONA_DEPTH - 0.4) / 2);
      createPanel(parts, DF - 2 * PANEL, 6, PANEL, 0, DF / 2 - 0.6 - 3, side * (DRONA_DEPTH + PANEL) / 2);
      createPanel(parts, DF - 2 * PANEL, 0.3, PANEL, 0, DF / 2 - 0.6 - 6 + 0.15, side * (DRONA_DEPTH / 2 + PANEL * 1.5), 0xb00000);
    }
    lowPolyGeometryCache = mergeGeometries(parts, false)!;
    parts.forEach(part => part.dispose());
    lowPolyGeometryCache.computeBoundingBox();
  }
  if (!lowPolyMaterialCache) {
    const weaveSize = 32;
    const weave = new Uint8Array(weaveSize * weaveSize);
    for (let y = 0; y < weaveSize; y++) for (let x = 0; x < weaveSize; x++) {
      weave[y * weaveSize + x] = (x + y) % 2 ? 122 : 134;
    }
    const weaveMap = new THREE.DataTexture(weave, weaveSize, weaveSize, THREE.RedFormat);
    weaveMap.wrapS = weaveMap.wrapT = THREE.RepeatWrapping;
    weaveMap.repeat.set(8, 8);
    weaveMap.magFilter = THREE.LinearFilter;
    weaveMap.minFilter = THREE.LinearMipmapLinearFilter;
    weaveMap.generateMipmaps = true;
    weaveMap.needsUpdate = true;
    lowPolyMaterialCache = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      vertexColors: true,
      roughness: 0.95,
      bumpMap: weaveMap,
      bumpScale: 0.015,
    });
  }
  return { geometry: lowPolyGeometryCache, material: lowPolyMaterialCache };
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

function LowPolyDronaMesh({ onSize }: { onSize?: (size: THREE.Vector3) => void }) {
  const { geometry, material } = getLowPolyAssets();

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
      userData={{ skipMerge: true, previewGlbPath: '' }}
    />
  );
}

export function Drona({ onSize, isPreview, actionState }: DronaProps) {
  const variant: DronaModelVariant = isPreview ? (actionState?.['drona-model-variant'] ?? 'blender-red') : 'blender-red';
  if (variant === 'low-poly') return <LowPolyDronaMesh onSize={onSize} />;
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
