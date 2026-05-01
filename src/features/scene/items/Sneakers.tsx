/**
 * Sneakers.tsx — Une paire de baskets (GLB media/sneaker.glb), couleur rouge.
 * Coordonnées locales : centré XZ, Y=0 = sol.
 * Gauche à X>0, droite à X<0 (miroir scale.z).
 * Fidèle à js/decor/sneakers.js.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei'; // preload only
import { useGLTFClone } from '@shared/utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@shared/utils/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_LENGTH = 28;
const GAP = 1;
const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });

export function Sneakers({ onSize }: SceneItemProps) {
  const { scene: left  } = useGLTFClone('media/sneaker.glb');
  const { scene: right } = useGLTFClone('media/sneaker.glb');

  useLayoutEffect(() => {
    removeGlbLines(left);
    removeGlbLines(right);
    left.scale.set(1, 1, 1);
    right.scale.set(1, 1, 1);

    const rawBox  = glbLocalBBox(left);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const s       = TARGET_LENGTH / Math.max(rawSize.x, rawSize.z);
    const shoeWid = rawSize.z * s;
    const floorY  = -rawBox.min.y * s;
    const localCX = (rawBox.min.x + rawBox.max.x) / 2 * s;

    function setup(shoe: THREE.Group, mirrorZ = false) {
      shoe.scale.setScalar(s);
      if (mirrorZ) shoe.scale.z *= -1;
      shoe.rotation.y = Math.PI / 2;
      shoe.traverse(m => {
        if ((m as THREE.Mesh).isMesh) {
          (m as THREE.Mesh).material = redMat;
          m.castShadow    = true;
          m.receiveShadow = true;
        }
      });
    }

    setup(left);
    left.position.set(shoeWid / 2 + GAP / 2, floorY, localCX);

    setup(right, true);
    right.position.set(-(shoeWid / 2 + GAP / 2), floorY, localCX);

    onSize(new THREE.Vector3(shoeWid * 2 + GAP, rawSize.y * s, rawSize.x * s));
  }, [left, right]);

  return (
    <>
      <primitive object={left} />
      <primitive object={right} />
    </>
  );
}

useGLTF.preload('media/sneaker.glb');
