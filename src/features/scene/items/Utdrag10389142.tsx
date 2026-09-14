import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { glbLocalBBox, optimizeMaterials, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

const ACTION_KEY = 'utdrag-toggle';
const RETRACT_OFFSET = -0.16; // Course de 16 cm (en mètres dans l'espace local du GLB avant scale 100)

/**
 * UTDRAG Hotte aspirante intégrée, acier inoxydable
 * Réf : IKEA 103.891.42
 * Modèle articulé : caisson fixe (Utdrag_Base) + tiroir télescopique (Utdrag_Drawer)
 */
export function Utdrag10389142({ onSize, actionState, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/utdrag10389142/Utdrag10389142.glb');
  const drawerRef = useRef<THREE.Object3D | null>(null);
  const openRef = useRef(false);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    optimizeMaterials(scene);

    const drawer = scene.getObjectByName('Utdrag_Drawer');
    drawerRef.current = drawer ?? null;

    // Ancrer la référence de centrage sur le déploiement complet
    // afin que le caisson reste fixe dans son meuble haut
    if (drawer) {
      drawer.position.y = 0;
    }

    scene.scale.setScalar(100);
    scene.rotation.x = Math.PI / 2;

    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));

    // Position initiale : pliée / rétractée dans le caisson
    if (drawer) {
      drawer.position.y = openRef.current ? 0 : RETRACT_OFFSET;
    }

    scene.userData.hoverAction = {
      label: 'Hotte UTDRAG',
      actionId: 'utdrag',
    };
  }, [scene, onSize]);

  // Synchronisation avec l'inventaire
  useEffect(() => {
    if (actionState && ACTION_KEY in actionState) {
      openRef.current = !!actionState[ACTION_KEY];
      invalidate();
    }
  }, [actionState, invalidate]);

  // Synchronisation avec les événements de scène
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail ?? {};
      if (key === 'utdrag' || key === ACTION_KEY) {
        openRef.current = !openRef.current;
        invalidate();
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate]);

  // Animation fluide télescopique
  useFrame((_, delta) => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    const targetY = openRef.current ? 0 : RETRACT_OFFSET;
    if (Math.abs(drawer.position.y - targetY) > 0.0005) {
      drawer.position.y = THREE.MathUtils.damp(drawer.position.y, targetY, 8, delta);
      invalidate();
    } else {
      drawer.position.y = targetY;
    }
  });

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/items/utdrag10389142/Utdrag10389142.glb');

