import { getObjectActionIds } from '../objectActions';
/**
 * Vihals.tsx — VIHALS chaise pliante, rouge (705.927.44).
 * Le GLB intègre la décomposition des pièces et le clip d'animation "vihals_fold".
 * L'état de pliage pilote l'AnimationMixer interne pour animer le modèle GLB.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
  const { scene, animations } = useGLTFClone(GLB);
  const { invalidate } = useThree();
  const runtime = useRef<{ mixer: THREE.AnimationMixer; action: THREE.AnimationAction } | null>(null);

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

    const clip = animations.find((a) => a.name === 'vihals_fold') ?? animations[0];
    if (clip) {
      const mixer = new THREE.AnimationMixer(scene);
      const action = mixer.clipAction(clip).play();
      action.paused = true;
      action.time = folded ? clip.duration : 0;
      mixer.update(0);
      runtime.current = { mixer, action };
    }

    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    onSize?.(box.getSize(new THREE.Vector3()));

    return () => {
      runtime.current?.mixer.stopAllAction();
      runtime.current?.mixer.uncacheRoot(scene);
      runtime.current = null;
    };
  }, [scene, animations, onSize]);

  useFrame((_, dt) => {
    const rt = runtime.current;
    if (!rt) return;

    const dur = rt.action.getClip().duration;
    const target = folded ? dur : 0;
    if (rt.action.time === target) return;

    const step = dt * 1.5;
    rt.action.time = THREE.MathUtils.clamp(
      rt.action.time + (folded ? step : -step),
      0,
      dur,
    );
    rt.mixer.update(0);
    invalidate();
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
