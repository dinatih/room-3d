import { useRef } from 'react';
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
  const initialized = useRef(false);
  const target      = useRef({ x, z, ry });
  target.current    = { x, z, ry };

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const { x: tx, z: tz, ry: try_ } = target.current;

    if (!initialized.current) {
      initialized.current = true;
      g.position.x = tx;
      g.position.z = tz;
      g.rotation.y = try_;
      return;
    }

    const dx = tx - g.position.x;
    const dz = tz - g.position.z;
    let   dry = try_ - g.rotation.y;
    while (dry >  Math.PI) dry -= 2 * Math.PI;
    while (dry < -Math.PI) dry += 2 * Math.PI;

    if (Math.abs(dx) > SNAP_POS || Math.abs(dz) > SNAP_POS || Math.abs(dry) > SNAP_ROT) {
      g.position.x += dx  * SPEED;
      g.position.z += dz  * SPEED;
      g.rotation.y += dry * SPEED;
      invalidate();
    } else {
      g.position.x = tx;
      g.position.z = tz;
      g.rotation.y = try_;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}
