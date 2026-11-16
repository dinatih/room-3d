/**
 * CharacterBaseballCap.tsx — Casquette camionneur rouge attachée à la tête d'un personnage.
 * Utilisée notamment pour la variante Vivida de Lara.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import { LAYER_WALKER } from '@config';
import { GLB_TRUCKER_CAP } from '../items/TruckerCap';

interface CharacterBaseballCapProps {
  attachTo: THREE.Object3D;
  color?: number | string;
}

export function CharacterBaseballCap({ attachTo, color }: CharacterBaseballCapProps) {
  const { scene } = useGLTFClone(GLB_TRUCKER_CAP);

  const capGroup = useMemo(() => {
    const group = new THREE.Group();
    group.name = 'character_baseball_cap_attachment';
    return group;
  }, []);

  useLayoutEffect(() => {
    if (!scene || !attachTo) return;

    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    // Dans le studio, la casquette fait ~20,5 cm (1 unité = 1 cm).
    // Lara étant scalée x100 dans Character (1 unité = 1 mètre = 100 cm),
    // 20,5 cm dans l'espace de l'armature correspondent à 0.205 unité.
    scene.scale.setScalar(0.205 / rawSize.x);

    // Centrage de la casquette : base à Y=0, centré en X/Z
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    // Ajustement de pose pour épouser le crâne et le front de Lara sans traverser les cheveux
    capGroup.position.set(-0.01, 0.152, 0.054);
    capGroup.rotation.set(-0.16, 0, 0);

    const clonedMats: THREE.Material[] = [];
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (color !== undefined && mesh.material instanceof THREE.MeshStandardMaterial) {
          const tinted = mesh.material.clone();
          tinted.color.set(color);
          mesh.material = tinted;
          clonedMats.push(tinted);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isHeadPart = true;
        mesh.userData.isBaseballCap = true;
        mesh.userData.itemName = 'Casquette camionneur rouge';
        mesh.layers.set(LAYER_WALKER);
      }
    });

    capGroup.clear();
    capGroup.add(scene);
    attachTo.add(capGroup);

    return () => {
      attachTo.remove(capGroup);
      capGroup.clear();
      clonedMats.forEach(m => m.dispose());
    };
  }, [scene, attachTo, color, capGroup]);

  return null;
}
