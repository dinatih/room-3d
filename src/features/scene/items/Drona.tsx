/**
 * Drona.tsx — Boîte de rangement IKEA DRONA.
 * Coordonnées locales : centré par bbox, Y=0 = sol, rouge.
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 *
 * Exports :
 *   Drona          — composant SceneItemProps (instance unique, inventaire)
 *   useDronaGeo    — hook retournant la géométrie active
 *   DroneCell      — boîte unique pour groupes positionnés
 *   DronaInstances — N boîtes via InstancedMesh, prend un tableau de Matrix4
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB_DRONA = 'media/glb/ikea-official/DRÖNA.glb';

const dronaMat = new THREE.MeshStandardMaterial({ 
  color: 0xcc0000, 
  roughness: 0.8, 
  side: THREE.DoubleSide
});

function useDronaGeoFrom(glb: typeof GLB_DRONA): THREE.BufferGeometry {
  const { nodes } = useGLTF(glb) as any;
  
  return useMemo(() => {
    // Find the first mesh in nodes
    const meshNode = Object.values(nodes).find((n: any) => n.isMesh) as THREE.Mesh | undefined;
    
    if (!meshNode || !meshNode.geometry) {
      console.warn('DRONA: No mesh found in GLB, using fallback box.');
      return new THREE.BoxGeometry(33, 33, 38);
    }
    
    const geo = meshNode.geometry.clone();
    
    // Scale by 99.5 (GLB is in meters, scene is in cm)
    // We use slightly less than 100 to avoid z-fighting with the Kallax shelf walls
    const scale = 99.5;
    geo.applyMatrix4(new THREE.Matrix4().makeScale(scale, scale, scale));
    
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
 * Retourne la géométrie BufferGeometry de la boîte DRONA active (scalée, centrée),
 * prête à l'emploi dans un InstancedMesh.
 */
export function useDronaGeo(): THREE.BufferGeometry {
  return useDronaGeoFrom(GLB_DRONA);
}

export function Drona({ onSize }: SceneItemProps) {
  const { scene } = useGLTF(GLB_DRONA);

  useLayoutEffect(() => {
    scene.scale.setScalar(99.5);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).material = dronaMat;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  const geo = useDronaGeoFrom(GLB_DRONA);
  return <mesh geometry={geo} material={dronaMat} castShadow receiveShadow />;
}

/** N boîtes Drona via InstancedMesh. Chaque Matrix4 encode position + rotation. */
export function DronaInstances({ matrices }: { matrices: THREE.Matrix4[] }) {
  const geo = useDronaGeoFrom(GLB_DRONA);
  const N = matrices.length;
  const apply = (mesh: THREE.InstancedMesh) => {
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh args={[geo, dronaMat, N]} castShadow receiveShadow onUpdate={apply} />;
}

useGLTF.preload(GLB_DRONA);
