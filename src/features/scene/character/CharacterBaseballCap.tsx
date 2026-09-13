/**
 * CharacterBaseballCap.tsx — Casquette baseball rouge attachée à la tête d'un personnage.
 * Utilisée notamment pour la variante Vivida de Lara.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines } from '@features/scene/glbUtils';
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

    // Échelle pour adapter la casquette (base 20 cm) aux proportions de la tête dans l'espace de l'armature
    const scale = 0.021;
    scene.scale.setScalar(scale);

    // Ajustement de pose pour épouser le crâne et le front de Lara
    // - Y = 0.105 (au-dessus du cou, au niveau du front)
    // - Z = -0.012 (centré sur le crâne, visière vers l'avant +Z)
    // - RotX = -0.08 (légère inclinaison naturelle vers l'arrière)
    scene.position.set(0, 0.105, -0.012);
    scene.rotation.set(-0.08, 0, 0);

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
