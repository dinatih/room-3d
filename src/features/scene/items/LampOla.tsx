/**
 * LampOla.tsx — Lampe IKEA OLA (GLB items/lamp-ola/lamp-ola.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, scale ×100, teintes jaunes → blanc.
 * Placement monde dans GlbItems.tsx.
 */
import { useState, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function LampOla({ actionState, onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/lamp-ola/lamp-ola.glb');
  const [topY, setTopY] = useState(95.5);
  const isOn = actionState?.on !== undefined
    ? Boolean(actionState.on)
    : Boolean(actionState?.['lamp-toggle'] || actionState?.lampOn);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    removeGlbLines(scene);
    scene.traverse(c => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.color) return;
      mesh.material = mat.clone();
      const hsl = { h: 0, s: 0, l: 0 };
      (mesh.material as THREE.MeshStandardMaterial).color.getHSL(hsl);
      if (hsl.h > 0.08 && hsl.h < 0.20 && hsl.s > 0.2) {
        (mesh.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      }
    });
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    const size = box.getSize(new THREE.Vector3());
    setTopY(size.y);
    onSize(size);
  }, [scene, onSize]);

  return (
    <group>
      <primitive object={scene} />
      {/* Disque diffuseur supérieur pointant vers le plafond */}
      <mesh position={[0, topY - 0.2, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[9.2, 32]} />
        <meshStandardMaterial
          color={isOn ? 0xfffaed : 0xd8d8d8}
          emissive={isOn ? 0xfff2d6 : 0x000000}
          emissiveIntensity={isOn ? 2.5 : 0}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('items/lamp-ola/lamp-ola.glb');
