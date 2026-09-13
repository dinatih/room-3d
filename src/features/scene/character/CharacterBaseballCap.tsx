/**
 * CharacterBaseballCap.tsx — Casquette baseball rouge attachée à la tête d'un personnage.
 * Utilisée notamment pour la variante Vivida de Lara.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import { LAYER_WALKER } from '@config';

interface CharacterBaseballCapProps {
  attachTo: THREE.Object3D;
  color?: number | string;
}

export function CharacterBaseballCap({ attachTo, color = 0xcc0000 }: CharacterBaseballCapProps) {
  const { scene } = useGLTFClone('characters/accessories/baseball_cap.glb');

  const capGroup = useMemo(() => {
    const group = new THREE.Group();
    group.name = 'character_baseball_cap_attachment';
    return group;
  }, []);

  useLayoutEffect(() => {
    if (!scene || !attachTo) return;

    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    // Dimensions brutes du GLB (identique à BaseballCap.tsx du studio)
    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    // Dans le studio, BaseballCap fait 20 cm (1 unité = 1 cm).
    // Lara étant scalée x100 dans SingleCharacter (1 unité = 1 mètre = 100 cm),
    // 20 cm dans l'espace de l'armature correspondent exactement à 0.20 unité.
    scene.scale.setScalar(0.20 / rawSize.x);

    // Centrage de la casquette : base à Y=0, centré en X/Z
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    // Ajustement de pose pour épouser le crâne et le front de Lara
    capGroup.position.set(-0.01, 0.20, 0.03);
    capGroup.rotation.set(-0.28, 0, 0);

    const redMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.65,
      metalness: 0.05,
    });

    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.material = redMat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isHeadPart = true;
        mesh.userData.itemName = 'Casquette baseball';
        mesh.layers.set(LAYER_WALKER);
      }
    });

    capGroup.clear();
    capGroup.add(scene);
    attachTo.add(capGroup);

    return () => {
      attachTo.remove(capGroup);
      capGroup.clear();
      redMat.dispose();
    };
  }, [scene, attachTo, color, capGroup]);

  return null;
}
