import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ReactNode } from 'react';

const SPEED    = 0.09;  // lerp factor (ease-out)
const SNAP_POS = 0.4;   // cm — seuil de snap
const SNAP_ROT = 0.004; // rad

export function PositionTransition({ x, z, ry, children }: {
  x: number; z: number; ry: number;
  children: ReactNode;
}) {
  const groupRef    = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();
  const current     = useRef({ x, z, ry });
  const isAnimating = useRef(false);

  useEffect(() => {
    isAnimating.current = true;
    invalidate();
  }, [x, z, ry, invalidate]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    const c = current.current;
    const dx = x - c.x;
    const dz = z - c.z;

    let targetRy = ry;
    while (targetRy > Math.PI) targetRy -= 2 * Math.PI;
    while (targetRy < -Math.PI) targetRy += 2 * Math.PI;

    let dry = targetRy - c.ry;
    while (dry > Math.PI) dry -= 2 * Math.PI;
    while (dry < -Math.PI) dry += 2 * Math.PI;

    if (Math.abs(dx) > SNAP_POS || Math.abs(dz) > SNAP_POS || Math.abs(dry) > SNAP_ROT) {
      isAnimating.current = true;
      c.x += dx * SPEED;
      c.z += dz * SPEED;
      c.ry += dry * SPEED;
      while (c.ry > Math.PI) c.ry -= 2 * Math.PI;
      while (c.ry < -Math.PI) c.ry += 2 * Math.PI;

      g.position.x = c.x;
      g.position.z = c.z;
      g.rotation.y = c.ry;
      invalidate();
    } else if (isAnimating.current) {
      isAnimating.current = false;
      c.x = x;
      c.z = z;
      c.ry = targetRy;
      g.position.x = x;
      g.position.z = z;
      g.rotation.y = ry;
      invalidate();
    }
  });

  return (
    <group
      ref={groupRef}
      position={[current.current.x, 0, current.current.z]}
      rotation={[0, current.current.ry, 0]}
      userData={{ skipMerge: true }}
    >
      {children}
    </group>
  );
}
