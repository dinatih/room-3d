/**
 * MannequinHead.tsx — Tête de mannequin (GLB media/glb/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 * Ajoute une perruque aléatoire depuis hair_pack_part_2.glb sur la tête.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 45;

// Noms exacts des 13 coiffures dans hair_pack_part_2.glb
const HAIR_ROOT_NAMES = [
  'Hair100_ARM_32',
  'Hair101_ARM_75',
  'Hair102_ARM_117',
  'Hair103_ARM_147',
  'Hair104_ARM_191',
  'Hair105_ARM_225',
  'Hair106_ARM_258',
  'Hair107_ARM_296',
  'Hair108_ARM_337',
  'Hair109_ARM_380',
  'Hair110_ARM_425',
  'Hair111_ARM_491',
  'Hair112_ARM_527',
];

export function MannequinHead({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/glb/wig_mannequin.glb');
  const { scene: hairScene } = useGLTFClone('media/hair_pack_part_2.glb');

  // Index stable par instance (ne change pas au re-render)
  const randomWigIndex = useMemo(() => Math.floor(Math.random() * HAIR_ROOT_NAMES.length), []);

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

    // Trouver la perruque choisie dans le pack
    const chosenName = HAIR_ROOT_NAMES[randomWigIndex];
    let wigNode: THREE.Object3D | undefined;
    hairScene.traverse((child) => {
      if (child.name === chosenName) wigNode = child;
    });

    if (wigNode != null) {
      const wig = wigNode as THREE.Object3D;
      // Calculer la bounding box de la perruque à échelle 1
      wig.scale.set(1, 1, 1);
      wig.position.set(0, 0, 0);
      wig.rotation.set(0, 0, 0);
      wig.updateMatrixWorld(true);
      const wigBox = new THREE.Box3().setFromObject(wig);
      const wigSize = wigBox.getSize(new THREE.Vector3());

      // Dimensionner la perruque pour qu'elle ait ~TARGET_H de hauteur
      // (la tête fait ~45cm, la perruque doit couvrir ~30cm soit 2/3 du haut)
      const wigScale = (TARGET_H * 0.7) / wigSize.y;
      wig.scale.setScalar(wigScale);

      // Recentrer XZ sur la tête
      wig.updateMatrixWorld(true);
      const wigBoxScaled = new THREE.Box3().setFromObject(wig);
      const wigCenter = wigBoxScaled.getCenter(new THREE.Vector3());
      // Placer la base de la perruque à ~60% de la hauteur de la tête
      wig.position.set(-wigCenter.x, TARGET_H * 0.55 - wigBoxScaled.min.y, -wigCenter.z);

      scene.add(wig);
    }

  }, [scene, hairScene, randomWigIndex]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/glb/wig_mannequin.glb');
useGLTF.preload('media/hair_pack_part_2.glb');
