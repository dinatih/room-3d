/**
 * Drona.tsx — Boîte de rangement IKEA DRONA.
 * Coordonnées locales : centré par bbox, Y=0 = sol, rouge.
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 *
 * Supporte 4 modes (commutable via useSceneStore / SidePanel) :
 *   - 'high'       : modèle officiel IKEA d'origine (~45k tris / boîte)
 *   - 'low'        : modèle décimé (~1.6k tris / boîte)
 *   - 'procedural' : BoxGeometry Three.js légère (~12 tris / boîte)
 *   - 'hidden'     : boîtes complètement masquées (0 tris)
 *
 * Exports :
 *   Drona          — composant SceneItemProps (instance unique, inventaire)
 *   useDronaGeo    — hook retournant la géométrie active selon le mode sélectionné
 *   DroneCell      — boîte unique pour groupes positionnés
 *   DronaInstances — N boîtes via InstancedMesh, prend un tableau de Matrix4
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import type { SceneItemProps } from '@shared/types';
import { useSceneStore } from '../store/useSceneStore';

const GLB_DRONA_HIGH = 'items/dröna/DRÖNA_high.glb';
const GLB_DRONA_LOW  = 'items/dröna/DRÖNA_low.glb';

const dronaMat = new THREE.MeshStandardMaterial({ 
  color: 0xcc0000, 
  roughness: 0.8, 
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});

function createProceduralDronaGeo(): THREE.BufferGeometry {
  // Dimensions DRONA : 33 x 38 x 33 cm (Largeur x Profondeur x Hauteur)
  // L'orientation standard : X=33, Y=33, Z=38
  const geo = new THREE.BoxGeometry(33, 33, 38);
  // Décalage pour avoir l'origine au centre au niveau du sol (Y=0)
  geo.translate(0, 33 / 2, 0);
  return geo;
}

function useDronaGeoFromGlb(glb: string): THREE.BufferGeometry {
  const { nodes } = useGLTF(glb) as any;
  
  return useMemo(() => {
    const meshNode = Object.values(nodes).find((n: any) => n.isMesh) as THREE.Mesh | undefined;
    
    if (!meshNode || !meshNode.geometry) {
      console.warn('DRONA: No mesh found in GLB, using fallback box.');
      return createProceduralDronaGeo();
    }
    
    const geo = meshNode.geometry.clone();
    
    // Scale by 99.5 (GLB is in meters, scene is in cm)
    const scale = 99.5;
    geo.applyMatrix4(new THREE.Matrix4().makeScale(scale, scale, scale));
    
    // Correction de l'orientation : pivoter de +90°
    geo.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
    
    // Center the geometry so the origin is at the bottom center
    const box = new THREE.Box3().setFromBufferAttribute(
      geo.getAttribute('position') as THREE.BufferAttribute
    );
    const center = box.getCenter(new THREE.Vector3());
    geo.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
    
    return geo;
  }, [nodes]);
}

/**
 * Retourne la géométrie BufferGeometry de la boîte DRONA selon le mode actif ('high' | 'low' | 'procedural').
 */
export function useDronaGeo(): THREE.BufferGeometry {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  const highGeo = useDronaGeoFromGlb(GLB_DRONA_HIGH);
  const lowGeo  = useDronaGeoFromGlb(GLB_DRONA_LOW);
  const procGeo = useMemo(() => createProceduralDronaGeo(), []);

  if (mode === 'procedural') return procGeo;
  if (mode === 'low') return lowGeo;
  return highGeo;
}

export function Drona({ onSize }: SceneItemProps) {
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
  return <mesh key={mode} geometry={geo} material={dronaMat} castShadow receiveShadow renderOrder={1} />;
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  const geo = useDronaGeo();
  if (mode === 'hidden') return null;
  return <mesh key={mode} geometry={geo} material={dronaMat} castShadow receiveShadow userData={{ skipMerge: true }} renderOrder={1} />;
}

/** N boîtes Drona via InstancedMesh. Chaque Matrix4 encode position + rotation. */
export function DronaInstances({ matrices }: { matrices: THREE.Matrix4[] }) {
  const mode = useSceneStore(state => state.furniture.dronaMode) ?? 'high';
  const geo = useDronaGeo();
  const N = matrices.length;
  const apply = (mesh: THREE.InstancedMesh) => {
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };
  if (mode === 'hidden') return null;
  return <instancedMesh key={mode} args={[geo, dronaMat, N]} castShadow receiveShadow onUpdate={apply} renderOrder={1} />;
}

useGLTF.preload(GLB_DRONA_HIGH);
useGLTF.preload(GLB_DRONA_LOW);

