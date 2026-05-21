/**
 * AutopilotPlane.tsx — Avion autopilote : lemniscate en 8
 * entre le studio (boucle nord) et le jardin (boucle sud).
 *
 * Équation paramétrique (t ∈ [0, 2π[) :
 *   x(t) = CX + R_X·sin(2t)    → x ∈ [40, 260] cm (Ø=220 < 300 ✓)
 *   z(t) = Z_CTR + R_Z·sin(t)  → z ∈ [-150, 200] cm
 *   h(t) = 175 + 25·sin(t)     → h ∈ [150, 200] cm (1.5–2 m)
 *   yaw  = atan2(−2·R_X·cos(2t), −R_Z·cos(t))
 *   bank = BANK_MAX·sin(t)      continu sur tout le tour
 *
 * Croisement en (CX, Z_CTR) à t=0 et t=π, tangentes différentes → vrai 8.
 */
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { ROOM_W } from '@config';
import { cameraState } from './cameraState';
import { PlaneMesh, type PlaneModelKey } from './PaperPlane';

// ── Paramètres ────────────────────────────────────────────────────────────────

const CX       = ROOM_W / 2;  // 150 cm — centre X
const Z_CTR    = 25;          // cm — Z du croisement
const R_X      = 110;         // cm — demi-largeur X → x ∈ [40, 260]
const R_Z      = 175;         // cm — demi-hauteur Z → z ∈ [-150, 200]
const BANK_MAX = 0.35;        // rad
const SPEED    = 0.5;         // rad/s — période ≈ 12.6 s

// ── Composant ─────────────────────────────────────────────────────────────────

interface AutopilotPlaneProps {
  model?: PlaneModelKey;
}

export function AutopilotPlane({ model = 'paper' }: AutopilotPlaneProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const t        = useRef(0);
  const euler    = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const { invalidate } = useThree();

  useEffect(() => {
    cameraState.autopilotActive = true;
    return () => { cameraState.autopilotActive = false; };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current = (t.current + SPEED * dt) % (2 * Math.PI);
    const p = t.current;

    const x    = CX + R_X * Math.sin(2 * p);
    const z    = Z_CTR + R_Z * Math.sin(p);
    const h    = 175 + 25 * Math.sin(p);
    const yaw  = Math.atan2(-2 * R_X * Math.cos(2 * p), -R_Z * Math.cos(p));
    const bank = BANK_MAX * Math.sin(p);

    euler.current.set(0, yaw, bank);
    groupRef.current.position.set(x, h, z);
    groupRef.current.quaternion.setFromEuler(euler.current);

    cameraState.autopilotX   = x;
    cameraState.autopilotZ   = z;
    cameraState.autopilotYaw = yaw;

    invalidate();
  });

  return (
    <group ref={groupRef}>
      <PlaneMesh model={model} />
    </group>
  );
}
