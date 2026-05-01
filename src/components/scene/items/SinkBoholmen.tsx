/**
 * SinkBoholmen.tsx — Évier BOHOLMEN + mitigeur LAGAN IKEA.
 * BOHOLMEN Évier 47x30 cm    : media/BOHOLMEN Évier 47x30 cm.glb
 * LAGAN Mitigeur chromé       : media/LAGAN Mitigeur chromé.glb
 * GLBs officiels IKEA en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = surface du plan de travail.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const GLB_SINK   = 'media/BOHOLMEN Évier 47x30 cm.glb';
const GLB_FAUCET = 'media/LAGAN Mitigeur chromé.glb';

// BOHOLMEN : 46.6×15.7×30 cm à ×100, Y-up (Y=0=fond de vasque)
const SINK_D = 30; // profondeur Z (cm)

export function SinkBoholmen({ onSize }: SceneItemProps) {
  const { scene: sinkScene   } = useGLTFClone(GLB_SINK);
  const { scene: faucetScene } = useGLTFClone(GLB_FAUCET);
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    // ── Vasque ──
    removeGlbLines(sinkScene);
    sinkScene.scale.setScalar(100);
    sinkScene.rotation.y = Math.PI / 2;
    const sinkBox = glbLocalBBox(sinkScene);
    sinkScene.position.set(
      -(sinkBox.min.x + sinkBox.max.x) / 2,
      -sinkBox.min.y,
      -(sinkBox.min.z + sinkBox.max.z) / 2,
    );
    sinkScene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });

    // ── Mitigeur — positionné à l'arrière de la vasque ──
    removeGlbLines(faucetScene);
    faucetScene.scale.setScalar(100);
    const fBox = glbLocalBBox(faucetScene);
    faucetScene.position.set(
      -(fBox.min.x + fBox.max.x) / 2,
      -fBox.min.y,
      -(fBox.min.z + fBox.max.z) / 2,
    );
    faucetScene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });

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
