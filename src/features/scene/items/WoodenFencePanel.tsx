import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Panneau de clôture bois utilisant le modèle GLB.
 * Centré en (0,0,0) avec dimensions locales w (X), h (Y), d (Z).
 */
export function WoodenFencePanel({ w, h, d }: { w: number; h: number; d: number }) {
  const { scene } = useGLTF('/items/fence-panel/fence-panel.glb');

  const { clone, groupRot, groupScale } = useMemo(() => {
    const c = scene.clone(true);
    c.position.set(0, 0, 0);
    c.scale.set(1, 1, 1);
    c.rotation.set(0, 0, 0);
    c.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Centre la géométrie interne à l'origine (0, 0, 0)
    c.position.set(-center.x, -center.y, -center.z);

    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
      }
    });

    if (size.x > size.z) {
      return {
        clone: c,
        groupRot: [0, Math.PI / 2, 0] as [number, number, number],
        groupScale: [d / size.x, h / size.y, w / size.z] as [number, number, number],
      };
    } else {
      return {
        clone: c,
        groupRot: [0, 0, 0] as [number, number, number],
        groupScale: [w / size.x, h / size.y, d / size.z] as [number, number, number],
      };
    }
  }, [scene, w, h, d]);

  return (
    <group rotation={groupRot} scale={groupScale}>
      <primitive object={clone} />
    </group>
  );
}

useGLTF.preload('/items/fence-panel/fence-panel.glb');

