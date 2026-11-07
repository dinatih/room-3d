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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import type { SceneModelProps } from '@shared/types';

/** Dimension standard d'une boîte DRONA (largeur / hauteur) en cm */
export const DF = 33;
export const DRONA_DEPTH = 38;
const PANEL = 0.2;
const parts: THREE.BufferGeometry[] = [];
function panel(w: number, h: number, d: number, x: number, y: number, z: number, tint = 0xffffff) {
  const geometry = new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const color = new THREE.Color(tint);
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  parts.push(geometry);
}
panel(DF, PANEL, DRONA_DEPTH, 0, -DF / 2 + PANEL / 2, 0);
for (const side of [-1, 1]) {
  panel(PANEL, DF - PANEL, DRONA_DEPTH, side * (DF - PANEL) / 2, PANEL / 2, 0);
  panel(DF - 2 * PANEL, DF - PANEL, PANEL, 0, PANEL / 2, side * (DRONA_DEPTH - PANEL) / 2);
  // Folded rim and wide fabric pull tab, matching the GLB's upper band.
  panel(DF, 0.6, 0.4, 0, (DF - 0.6) / 2, side * (DRONA_DEPTH - 0.4) / 2);
  panel(DF - 2 * PANEL, 6, PANEL, 0, DF / 2 - 0.6 - 3, side * (DRONA_DEPTH + PANEL) / 2);
  panel(DF - 2 * PANEL, 0.3, PANEL, 0, DF / 2 - 0.6 - 6 + 0.15, side * (DRONA_DEPTH / 2 + PANEL * 1.5), 0x800000);
}
const cellGeometry = mergeGeometries(parts, false)!;
parts.forEach(part => part.dispose());
cellGeometry.computeBoundingBox();
// A small repeating weave, shared by every box and filtered at a distance.
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
const cellMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000, vertexColors: true, roughness: 0.95, bumpMap: weaveMap, bumpScale: 0.015 });

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
  return <mesh geometry={cellGeometry} material={cellMaterial} dispose={null} castShadow receiveShadow />;
}
