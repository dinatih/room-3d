/**
 * VasqueSdb.tsx — Meuble-vasque HAVBÄCK - ORRSJÖN IKEA.
 * media/HAVBÄCK - ORRSJÖN Meuble avec tiroirs-vasque-mitigeur blanc 62x49x69 cm.glb
 * GLB officiel IKEA en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 *
 * Note : le miroir Reflector est rendu séparément par Mirrors.tsx (MirrorSDB).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const GLB = 'media/HAVBÄCK - ORRSJÖN Meuble avec tiroirs-vasque-mitigeur blanc 62x49x69 cm.glb';

// Lampe LED au-dessus du miroir (coords locales)
const LAMP_Y = 176;
const LAMP_Z = -15;

export function VasqueSdb({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return (
    <group>
      <primitive object={scene} />
      <pointLight position={[0, LAMP_Y, LAMP_Z]}
        intensity={15} distance={120} decay={2} color={0xffeedd} />
    </group>
  );
}

useGLTF.preload(GLB);
