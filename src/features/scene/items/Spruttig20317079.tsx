import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

const SPRUTTIG_GLB = '/items/spruttig20317079/Spruttig20317079.glb';

export function useSpruttigAsset() {
  const { scene } = useGLTF(SPRUTTIG_GLB);
  return useMemo(() => {
    const clone = scene.clone(true);
    clone.scale.set(1, 1, 1);
    removeGlbLines(clone);
    clone.scale.setScalar(100);
    mergeGlbByMaterial(clone);
    let targetGeom: THREE.BufferGeometry | null = null;
    let targetMat: THREE.Material | THREE.Material[] | null = null;
    clone.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.isMesh && !targetGeom) {
        targetGeom = mesh.geometry.clone();
        targetMat = mesh.material;
      }
    });
    if (targetGeom) {
      const g = targetGeom as THREE.BufferGeometry;
      g.computeBoundingBox();
      const box = g.boundingBox ?? new THREE.Box3();
      const center = box.getCenter(new THREE.Vector3());
      g.translate(-center.x, -box.min.y, -center.z);
    }
    return { geometry: targetGeom, material: targetMat };
  }, [scene]);
}

/**
 * Rendu optimisé de plusieurs cintres SPRUTTIG via un unique instancedMesh.
 */
export function SpruttigInstances({
  transforms,
  userData,
}: {
  transforms: Array<{ position: [number, number, number]; rotation?: [number, number, number]; scale?: number }>;
  userData?: Record<string, any>;
}) {
  const { geometry, material } = useSpruttigAsset();
  const count = transforms.length;
  const instRef = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    if (!instRef.current || !geometry) return;
    const dummy = new THREE.Object3D();
    transforms.forEach((t, i) => {
      dummy.position.set(...t.position);
      if (t.rotation) dummy.rotation.set(...t.rotation);
      else dummy.rotation.set(0, 0, 0);
      const s = t.scale ?? 1;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      instRef.current.setMatrixAt(i, dummy.matrix);
    });
    instRef.current.instanceMatrix.needsUpdate = true;
  }, [transforms, geometry]);

  if (!geometry || !material) return null;

  return (
    <instancedMesh
      ref={instRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
      userData={userData ?? { animUnit: true, isIkea: true, itemName: 'Cintres Spruttig' }}
    />
  );
}

/**
 * SPRUTTIG cintre, noir (version unitaire)
 * Price: 3,50
 * URL: https://www.ikea.com/fr/fr/p/spruttig-cintre-noir-20317079/
 */
export function Spruttig20317079({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone(SPRUTTIG_GLB);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(SPRUTTIG_GLB);
