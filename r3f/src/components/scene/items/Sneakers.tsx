/**
 * Sneakers.tsx — Une paire de baskets (GLB media/sneaker.glb), couleur rouge.
 * Coordonnées locales : centré XZ, Y=0 = sol.
 * Gauche à X>0, droite à X<0 (miroir scale.z).
 * Fidèle à js/decor/sneakers.js.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const TARGET_LENGTH = 28;
const GAP = 1;
const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });

export function Sneakers({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/sneaker.glb') as any;

  const { left, right, size } = useMemo(() => {
    removeGlbLines(scene);
    const rawBox  = new THREE.Box3().setFromObject(scene);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const s       = TARGET_LENGTH / Math.max(rawSize.x, rawSize.z);
    const shoeWid = rawSize.z * s;
    const floorY  = -rawBox.min.y * s;
    const localCX = (rawBox.min.x + rawBox.max.x) / 2 * s;

    function makeShoe(): THREE.Group {
      const c = scene.clone(true) as THREE.Group;
      c.scale.setScalar(s);
      c.rotation.y = Math.PI / 2;
      c.traverse(m => {
        if ((m as THREE.Mesh).isMesh) {
          (m as THREE.Mesh).material = redMat;
          m.castShadow    = true;
          m.receiveShadow = true;
        }
      });
      return c;
    }

    const left = makeShoe();
    left.position.set(shoeWid / 2 + GAP / 2, floorY, localCX);

    const right = makeShoe();
    right.scale.z *= -1;
    right.position.set(-(shoeWid / 2 + GAP / 2), floorY, localCX);

    const size = new THREE.Vector3(shoeWid * 2 + GAP, rawSize.y * s, rawSize.x * s);
    return { left, right, size };
  }, [scene]);

  useLayoutEffect(() => {
    onSize(size);
  }, [size]);

  return (
    <>
      <primitive object={left} />
      <primitive object={right} />
    </>
  );
}

useGLTF.preload('media/sneaker.glb');
