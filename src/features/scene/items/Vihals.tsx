import { getObjectActionIds } from '../objectActions';
/**
 * Vihals.tsx — VIHALS chaise pliante, rouge (705.927.44).
 * Le modèle GLB d'origine a été décomposé en 3 sous-objets articulés :
 * - Cadre arrière & dossier (vihals_back)
 * - Cadre pieds avant pivotant (Vihals_Front_Pivot)
 * - Assise pivotante (Vihals_Seat_Pivot)
 *
 * Animation fluide de pliage / dépliage cinématique appliquée directement sur les pièces du GLB.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps, SceneModelProps } from '@shared/types';

const GLB = 'items/vihals70592744/Vihals70592744.glb';

interface VihalsAnimatedProps extends SceneModelProps {
  folded: boolean;
}

function VihalsModel({ folded, onSize }: VihalsAnimatedProps) {
  const { scene } = useGLTFClone(GLB);

  const frontPivotRef = useRef<THREE.Object3D | null>(null);
  const seatPivotRef = useRef<THREE.Object3D | null>(null);
  const rootNodeRef = useRef<THREE.Object3D | null>(null);
  const animT = useRef(folded ? 1 : 0);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });

    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    // Repérage des pivots décomposés dans le GLB
    frontPivotRef.current = scene.getObjectByName('Vihals_Front_Pivot') ?? null;
    seatPivotRef.current = scene.getObjectByName('Vihals_Seat_Pivot') ?? null;
    rootNodeRef.current = scene.getObjectByName('Vihals_Root') ?? scene;

    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  useFrame((_, delta) => {
    const target = folded ? 1 : 0;
    if (Math.abs(animT.current - target) > 0.0005) {
      animT.current = THREE.MathUtils.damp(animT.current, target, 9, delta);
    } else {
      animT.current = target;
    }

    const t = animT.current;

    // Redressement vertical du cadre arrière (en cm et radians)
    if (rootNodeRef.current) {
      rootNodeRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.16, t);
      rootNodeRef.current.position.z = THREE.MathUtils.lerp(0, 0.03, t);
    }

    // Pivot des pieds avant : rabattus le long du cadre arrière
    if (frontPivotRef.current) {
      frontPivotRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.66, t);
    }

    // Pivot de l'assise : relevée verticalement contre le dossier
    if (seatPivotRef.current) {
      seatPivotRef.current.rotation.x = THREE.MathUtils.lerp(0, 1.44, t);
    }
  });

  return <primitive object={scene} />;
}

// ── Composant principal ──────────────────────────────────────────────────────
export function Vihals({ onSize, actionState = {}, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const sceneState = useFurnitureToggles(['vihals-toggle']);
  const folded = Boolean((isPreview ? actionState : sceneState)['vihals-toggle']);

  return (
    <group userData={{
      hoverAction: {
        label: folded ? 'VIHALS (Pliée)' : 'VIHALS (Dépliée)',
        actions: getObjectActionIds('vihals-chair'),
      },
    }}>
      <VihalsModel folded={folded} onSize={onSize} />
    </group>
  );
}

useGLTF.preload(GLB);
