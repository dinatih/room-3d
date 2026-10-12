/**
 * CharacterBallProp.tsx — Accessoire Ballon de plage / sport attaché au personnage
 * lors des animations Free Fire de football ou basketball.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import { LAYER_WALKER } from '@config';

interface CharacterBallPropProps {
  attachTo: THREE.Object3D | null;
  mode: 'foot' | 'basket';
}

export function CharacterBallProp({ attachTo, mode }: CharacterBallPropProps) {
  const { scene } = useGLTFClone('items/beach_ball.glb');

  const ballGroup = useMemo(() => {
    const group = new THREE.Group();
    group.name = 'character_ball_prop_attachment';
    return group;
  }, []);

  useLayoutEffect(() => {
    if (!scene || !attachTo) return;

    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    // Dimensions brutes du ballon (beach_ball fait ~2 unités brutes de diamètre)
    const rawBox = glbLocalBBox(scene);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 2.0;

    // Échelle :
    // - Foot : diamètre ~22 cm -> 0.22 unité (dans l'armature scalée x100)
    // - Basket : diamètre ~24 cm -> 0.24 unité
    const targetDiameter = mode === 'foot' ? 0.22 : 0.24;
    scene.scale.setScalar(targetDiameter / maxDim);

    // Centrer le ballon sur son point de pivot local
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      -(box.min.z + box.max.z) / 2
    );

    // Décalage selon le membre d'attache :
    if (mode === 'foot') {
      // Devant le coup de pied / cheville droite
      ballGroup.position.set(0.0, 0.05, 0.12);
      ballGroup.rotation.set(0, 0, 0);
    } else {
      // Dans la paume de la main droite
      ballGroup.position.set(0.0, -0.08, 0.05);
      ballGroup.rotation.set(0, 0, 0);
    }

    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.itemName = mode === 'foot' ? 'Ballon de foot' : 'Ballon de basket';
        mesh.layers.set(LAYER_WALKER);
      }
    });

    ballGroup.clear();
    ballGroup.add(scene);
    attachTo.add(ballGroup);

    return () => {
      attachTo.remove(ballGroup);
      ballGroup.clear();
    };
  }, [scene, attachTo, mode, ballGroup]);

  return null;
}
