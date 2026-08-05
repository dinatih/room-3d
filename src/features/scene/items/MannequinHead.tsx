/**
 * MannequinHead.tsx — Tête de mannequin (GLB media/glb/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 45;

export function MannequinHead({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/glb/wig_mannequin.glb');
  const { scene: hairScene } = useGLTFClone('media/hair_pack_part_2.glb');
  
  const randomWigIndex = useMemo(() => Math.floor(Math.random() * 12), []);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    removeGlbLines(hairScene);
    
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    const scaleFactor = TARGET_H / raw.y;
    scene.scale.setScalar(scaleFactor);
    
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));

    // Le plus simple : on rend tout invisible, puis on affiche les noeuds liés au randomWigIndex
    hairScene.traverse(c => {
       if ((c as THREE.Mesh).isMesh) {
           c.visible = false;
       }
    });
    
    const suffix = randomWigIndex === 0 ? '' : `.${String(randomWigIndex).padStart(3, '0')}`;
    hairScene.traverse(c => {
        if (c.name === `Hair${suffix}` || c.name === `Scalp${suffix}` || c.name === `HairTie${suffix}` || c.name === `HairTieExtra${suffix}`) {
            c.traverse(cc => { cc.visible = true; });
        }
    });

    // Ajuster la position et l'échelle de la perruque pour qu'elle s'adapte à la tête
    hairScene.scale.setScalar(scaleFactor * 0.15); // Facteur à ajuster selon le modèle
    hairScene.position.set(0, TARGET_H * 0.8, 0); // Placer sur le haut de la tête

    scene.add(hairScene);

  }, [scene, hairScene, randomWigIndex]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/glb/wig_mannequin.glb');
useGLTF.preload('media/hair_pack_part_2.glb');
