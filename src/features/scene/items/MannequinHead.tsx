/**
 * MannequinHead.tsx — Tête de mannequin (GLB media/glb/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 * Ajoute une perruque aléatoire depuis hair_pack_part_2.glb (même logique que Walker.tsx).
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 45;

// Les 13 prefixes de coiffures dans hair_pack_part_2.glb
// (noms de nœuds: Hair100_ARM_32, Hair101_ARM_75, ... Hair112_ARM_527)
const HAIR_NUMBERS = ['100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112'];


export function MannequinHead({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/glb/wig_mannequin.glb');
  const hairPack = useGLTF('media/hair_pack_part_2.glb');

  // Index stable par instance (ne change pas au re-render)
  const randomWigNumber = useMemo(() => HAIR_NUMBERS[Math.floor(Math.random() * HAIR_NUMBERS.length)], []);

  useLayoutEffect(() => {
    removeGlbLines(scene);

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

    // Même logique que Walker.tsx haircut swap
    if (!hairPack?.scene) return;

    // 1. Trouver le nœud source dans le pack (ex: "Hair100_ARM_32")
    const targetGroupName = `Hair${randomWigNumber}_ARM_`;
    let sourceGroup: THREE.Object3D | null = null;
    hairPack.scene.traverse(child => {
      if (!sourceGroup && child.name.startsWith(targetGroupName)) {
        sourceGroup = child;
      }
    });

    if (!sourceGroup) return;

    // 2. Cloner avec SkeletonUtils pour préserver les bones/skinning
    const clonedHair = SkeletonUtils.clone(sourceGroup as THREE.Object3D);

    // 3. Configurer les matériaux (identique à Walker.tsx)
    clonedHair.traverse((child: THREE.Object3D) => {
      child.frustumCulled = false;
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.visible = true;
        m.renderOrder = 1;
        if (Array.isArray(m.material)) {
          m.material = m.material.map(mat => {
            if (!mat) return mat;
            const clonedMat = mat.clone();
            clonedMat.side = THREE.DoubleSide;
            clonedMat.alphaTest = 0.5;
            clonedMat.depthWrite = true;
            clonedMat.needsUpdate = true;
            return clonedMat;
          });
        } else if (m.material) {
          const clonedMat = m.material.clone();
          clonedMat.side = THREE.DoubleSide;
          clonedMat.alphaTest = 0.5;
          clonedMat.depthWrite = true;
          clonedMat.needsUpdate = true;
          m.material = clonedMat;
        }
      }
    });

    // 4. Trouver l'os bip_head dans la coupe pour aligner
    let hairHeadBone: THREE.Object3D | null = null;
    clonedHair.traverse((c: THREE.Object3D) => {
      const nLower = (c.name || '').toLowerCase();
      if (nLower.startsWith('bip_head') && !hairHeadBone) hairHeadBone = c;
    });

    // 5. Échelle comme Walker.tsx (×1.4) + repositionner
    const s = 1.4;
    clonedHair.scale.set(s, s, s);

    if (hairHeadBone) {
      clonedHair.updateMatrixWorld(true);
      const headLocalPos = (hairHeadBone as THREE.Object3D).position.clone();
      clonedHair.position.set(
        -headLocalPos.x * s,
        TARGET_H * 0.78 - headLocalPos.y * s,
        -headLocalPos.z * s,
      );
    } else {
      // Fallback : placer environ à 80% de la hauteur de la tête
      clonedHair.position.set(0, TARGET_H * 0.78, 0);
    }

    scene.add(clonedHair);

  }, [scene, hairPack, randomWigNumber]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/glb/wig_mannequin.glb');
useGLTF.preload('media/hair_pack_part_2.glb');
