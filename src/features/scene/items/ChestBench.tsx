/**
 * ChestBench.tsx — Coffre banc YITAHOME 100 Gal (122×55×62cm).
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { getObjectActionIds } from '../objectActions';

const L = 122, W = 55, H = 62, LID_H = 3, WALL = 2;

const cbMat    = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6 });
const cbLidMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 });

export function ChestBench({ onSize, actionState }: SceneItemProps) {
  const lidRef = useRef<THREE.Group>(null!);
  const isOpen = actionState['chest-bench-open'] ?? false;
  const { invalidate } = useThree();
  useFrame((_, dt) => {
    const target = isOpen ? -Math.PI * 100 / 180 : 0;
    const lid = lidRef.current;
    if (lid.rotation.x === target) return;
    const angle = THREE.MathUtils.damp(lid.rotation.x, target, 6, dt);
    lid.rotation.x = Math.abs(angle - target) < 0.001 ? target : angle;
    invalidate();
  });
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(L, H, W));
  }, []);

  return (
    <group userData={{ sceneItemRoot: true, skipMerge: true, hoverAction: { label: 'Banc coffre jardin', actions: getObjectActionIds('chest-bench') } }}>
      {/* Fond et quatre parois, ouverts au-dessus. */}
      {[
        { position: [0, WALL / 2, 0], size: [L, WALL, W] },
        ...[-1, 1].flatMap(side => [
          { position: [side * (L - WALL) / 2, (H - LID_H + WALL) / 2, 0], size: [WALL, H - LID_H - WALL, W] },
          { position: [0, (H - LID_H + WALL) / 2, side * (W - WALL) / 2], size: [L - WALL * 2, H - LID_H - WALL, WALL] },
        ]),
      ].map(({ position, size }, i) => (
        <mesh key={i} position={position as [number, number, number]} castShadow receiveShadow material={cbMat}>
          <boxGeometry args={size as [number, number, number]} />
        </mesh>
      ))}
      {/* Pivot sur le bord arrière : l'assise se soulève vers l'arrière. */}
      <group ref={lidRef} position={[0, H - LID_H, -W / 2]}>
        <mesh userData={{ birdPerch: !isOpen }} position={[0, LID_H / 2, W / 2]} castShadow receiveShadow material={cbLidMat}>
          <boxGeometry args={[L + 1.5, LID_H, W + 1.5]} />
        </mesh>
      </group>
      {[-1, 1].map(side => (
        <mesh key={`hinge-${side}`} position={[side * L / 3, H - LID_H, -W / 2]} rotation={[0, 0, Math.PI / 2]} material={handleMat} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 8, 12]} />
        </mesh>
      ))}
      {([-1, 1] as const).map(dx => (
        <mesh key={dx} position={[dx * (L / 2 + 0.8), H * 0.55, 0]} material={handleMat}>
          <boxGeometry args={[1.5, 3, 15]} />
        </mesh>
      ))}
    </group>
  );
}
