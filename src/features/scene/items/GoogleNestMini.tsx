/**
 * GoogleNestMini.tsx — Google Nest Mini 2 (GLB media/google_nest_mini_2.glb).
 * Diamètre normalisé 10 cm (réf : Nest Mini ≈ Ø9,8 × 4,2 cm).
 *
 * Animation "Ok Google" : 4 LEDs procédurales émissives (bleu/rouge/jaune/vert Google)
 * déclenchées par furniture-toggle { key: 'nestMini' }, one-shot ~3.5s.
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_W     = 10;   // diamètre cible (X)
const DOT_R        = 0.35; // rayon sphère LED
const ANIM_DURATION = 3.5; // secondes avant extinction auto
const WAVE_SPEED   = 5.0;  // rad/s

const GOOGLE_COLORS = [
  new THREE.Color(0x4285F4),  // Blue
  new THREE.Color(0xEA4335),  // Red
  new THREE.Color(0xFBBC05),  // Yellow
  new THREE.Color(0x34A853),  // Green
];

// Positions X des 4 LEDs (ligne horizontale centrée, ~1.5 cm d'espacement)
const DOT_X = [-2.25, -0.75, 0.75, 2.25];

export function GoogleNestMini({ onSize }: SceneItemProps) {
  const { scene }    = useGLTFClone('media/google_nest_mini_2.glb');
  const dotsGroupRef = useRef<THREE.Group>(null!);
  const dotMatsRef   = useRef<THREE.MeshStandardMaterial[]>([]);
  const animRef      = useRef(false);
  const timeRef      = useRef(0);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_W / raw.x);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));

    scene.userData.hoverAction = { label: 'Google Nest Mini', actionId: 'nestMini' };

    // Positionne le groupe LEDs sur la face supérieure du device
    const topY = (box.max.y - box.min.y) / 2;
    dotsGroupRef.current.position.set(0, topY + DOT_R + 0.2, 0);
  }, [scene]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key !== 'nestMini') return;
      animRef.current = true;
      timeRef.current = 0;
      invalidate();
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate]);

  useFrame((_, delta) => {
    if (!animRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    if (t > ANIM_DURATION) {
      animRef.current = false;
      dotMatsRef.current.forEach(m => { m.emissiveIntensity = 0; });
      invalidate();
      return;
    }

    // Enveloppe : fade-in 0→0.5s, fade-out 3→3.5s
    const envelope = Math.min(t / 0.5, 1) * Math.min((ANIM_DURATION - t) / 0.5, 1);
    dotMatsRef.current.forEach((mat, i) => {
      const phase = i * (Math.PI / 2);
      mat.emissiveIntensity = Math.max(0, Math.sin(t * WAVE_SPEED - phase)) * envelope * 4.0;
    });
    invalidate();
  });

  return (
    <>
      <primitive object={scene} />
      <group ref={dotsGroupRef}>
        {DOT_X.map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[DOT_R, 8, 6]} />
            <meshStandardMaterial
              ref={(m) => { if (m) dotMatsRef.current[i] = m; }}
              color={GOOGLE_COLORS[i]}
              emissive={GOOGLE_COLORS[i]}
              emissiveIntensity={0}
              roughness={0.3}
              metalness={0}
              depthTest={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

useGLTF.preload('media/google_nest_mini_2.glb');
