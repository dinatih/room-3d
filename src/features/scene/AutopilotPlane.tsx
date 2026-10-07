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

import { ROOM_W } from './wallData';
import { cameraState } from './cameraState';
import { CategoryLayerGroup } from './sceneLayer';
import { LAYER_AIRCRAFT } from './config';
import type { AircraftFlightControls } from './koiFlightControls';
import { PlaneMesh, PITCH_RATE, ROLL_RATE, ROLL_TO_YAW, SPEED_MAX, type PlaneModelKey } from './PaperPlane';
import { DEFAULT_PLANE_MODEL } from './aircraftModels';

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

export function AutopilotPlane({ model = DEFAULT_PLANE_MODEL }: AutopilotPlaneProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const controls = useRef<AircraftFlightControls>({ pitch: 0, roll: 0, yaw: 0, power: 0 });
  const previousPitch = useRef<number | null>(null);
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

    const dx = 2 * R_X * Math.cos(2 * p), dz = R_Z * Math.cos(p);
    const pitch = Math.atan2(25 * Math.cos(p), Math.hypot(dx, dz));
    const yawRate = (dz * (-4 * R_X * Math.sin(2 * p)) - dx * (-R_Z * Math.sin(p))) / (dx * dx + dz * dz) * SPEED;
    controls.current.pitch = previousPitch.current === null || dt === 0 ? 0 : THREE.MathUtils.clamp((pitch - previousPitch.current) / dt / PITCH_RATE, -1, 1);
    controls.current.roll = BANK_MAX * Math.cos(p) * SPEED / ROLL_RATE;
    controls.current.yaw = THREE.MathUtils.clamp(yawRate / ROLL_TO_YAW, -1, 1);
    controls.current.power = THREE.MathUtils.clamp(Math.hypot(dx, dz, 25 * Math.cos(p)) * SPEED / SPEED_MAX, 0, 1);
    previousPitch.current = pitch;
    euler.current.set(pitch, yaw, bank);
    groupRef.current.position.set(x, h, z);
    groupRef.current.quaternion.setFromEuler(euler.current);

    cameraState.autopilotX   = x;
    cameraState.autopilotZ   = z;
    cameraState.autopilotYaw = yaw;

    invalidate();
  });

  return (
    <group ref={groupRef}>
      <CategoryLayerGroup layer={LAYER_AIRCRAFT} register={false}>
        <PlaneMesh model={model} controls={controls.current} />
      </CategoryLayerGroup>
    </group>
  );
}
