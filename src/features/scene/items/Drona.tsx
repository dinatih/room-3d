import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GlbBridge } from '@features/scene/GlbBridge';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '../useGLTFClone';
import { removeGlbLines, mergeGlbByMaterial } from '../glbUtils';

const GLB = 'media/glb/DRÖNA.glb';

export function Drona(props: SceneItemProps) {
  return <GlbBridge glbPath={GLB} {...props} />;
}

/** Cellule Drona unique pour les Kallax. */
export function DroneCell() {
  const { scene } = useGLTFClone(GLB);
  useMemo(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.set(-center.x, -box.min.y, -center.z);
  }, [scene]);
  return <primitive object={scene} />;
}

/** Version optimisée instanciée pour les groupes massifs. */
export function DronaInstances({ matrices }: { matrices: THREE.Matrix4[] }) {
  const { scene } = useGLTF(GLB);
  const mesh = useMemo(() => {
    let target: THREE.Mesh | null = null;
    scene.traverse(o => { if ((o as THREE.Mesh).isMesh && !target) target = o as THREE.Mesh; });
    return target;
  }, [scene]);

  if (!mesh) return null;

  return (
    <instancedMesh args={[(mesh as any).geometry, (mesh as any).material, matrices.length]} castShadow receiveShadow>
      {matrices.map((m, i) => (
        <primitive key={i} object={new THREE.Object3D()} onUpdate={(self: THREE.Object3D) => {
          self.position.setFromMatrixPosition(m);
          self.quaternion.setFromRotationMatrix(m);
          self.scale.setFromMatrixScale(m);
          self.updateMatrixWorld();
        }} />
      ))}
    </instancedMesh>
  );
}

useGLTF.preload(GLB);
