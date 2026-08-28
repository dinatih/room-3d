import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

const GLB_SINK   = '/items/boholmen99157501/Boholmen99157501.glb';
const GLB_FAUCET = 'items/lagan mitigeur chromé/LAGAN Mitigeur chromé.glb';

/**
 * BOHOLMEN évier intégré, 1 bac, acier inoxydable, 47x30 cm + mitigeur LAGAN
 * URL: https://www.ikea.com/fr/fr/p/boholmen-evier-integre-1-bac-acier-inoxydable-s99157501/
 */
export function Boholmen99157501({ onSize, ...props }: SceneItemProps) {
  const { scene: sinkScene   } = useGLTFClone(GLB_SINK);
  const { scene: faucetScene } = useGLTFClone(GLB_FAUCET);
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    // ── Vasque ──
    sinkScene.scale.set(1, 1, 1);
    removeGlbLines(sinkScene);
    sinkScene.scale.setScalar(100);
    sinkScene.rotation.y = Math.PI / 2;
    mergeGlbByMaterial(sinkScene);
    const sinkBox = glbLocalBBox(sinkScene);
    sinkScene.position.set(
      -(sinkBox.min.x + sinkBox.max.x) / 2,
      -sinkBox.min.y,
      -(sinkBox.min.z + sinkBox.max.z) / 2,
    );

    // ── Mitigeur ──
    faucetScene.scale.set(1, 1, 1);
    removeGlbLines(faucetScene);
    faucetScene.scale.setScalar(100);
    mergeGlbByMaterial(faucetScene);
    const fBox = glbLocalBBox(faucetScene);
    faucetScene.position.set(
      -(fBox.min.x + fBox.max.x) / 2,
      -fBox.min.y,
      -(fBox.min.z + fBox.max.z) / 2,
    );

    groupRef.current.updateMatrixWorld(true);
    onSize?.(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, [sinkScene, faucetScene, onSize]);

  return (
    <group ref={groupRef} {...props}>
      <primitive object={sinkScene} />
      <group position={[0, 15, 16]} rotation={[0, Math.PI, 0]}>
        <primitive object={faucetScene} />
      </group>
    </group>
  );
}

useGLTF.preload(GLB_SINK);
useGLTF.preload(GLB_FAUCET);
