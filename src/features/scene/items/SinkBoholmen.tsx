/**
 * SinkBoholmen.tsx — Évier BOHOLMEN + mitigeur LAGAN IKEA.
 * BOHOLMEN Évier 47x30 cm    : media/glb/BOHOLMEN Évier 47x30 cm.glb
 * LAGAN Mitigeur chromé       : media/glb/LAGAN Mitigeur chromé.glb
 * GLBs officiels IKEA en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = surface du plan de travail.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB_SINK   = 'items/BOHOLMEN Évier 47x30 cm.glb';
const GLB_FAUCET = 'items/LAGAN Mitigeur chromé.glb';

// BOHOLMEN : 46.6×15.7×30 cm à ×100, Y-up (Y=0=fond de vasque)

export function SinkBoholmen({ onSize }: SceneItemProps) {
  const { scene: sinkScene   } = useGLTFClone(GLB_SINK);
  const { scene: faucetScene } = useGLTFClone(GLB_FAUCET);
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    // ── Vasque ──
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

    // ── Mitigeur — positionné à l'arrière de la vasque ──
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
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, [sinkScene, faucetScene]);

  return (
    <group ref={groupRef}>
      <primitive object={sinkScene} />
      {/* Mitigeur à 5 cm du fond de niche, rotation 180° */}
      <group position={[0, 15, 16]} rotation={[0, Math.PI, 0]}>
        <primitive object={faucetScene} />
      </group>
    </group>
  );
}

useGLTF.preload(GLB_SINK);
useGLTF.preload(GLB_FAUCET);
