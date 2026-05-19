/**
 * PaperPlane.tsx — Mode "Avion en papier" : pilote un avion en papier.
 *
 * Contrôles :
 *   W / ↑       — piquer (nose down)
 *   S / ↓       — cabrer (nose up)
 *   A / ←       — roulis gauche (le banking fait virer)
 *   D / →       — roulis droit
 *   Espace      — accélérer (poussée)
 *   Shift       — freiner
 *   F / Échap   — quitter le mode avion
 *
 * Physique simplifiée :
 *   - glissé constant vers l'avant (sin/cos du yaw/pitch)
 *   - gravité douce
 *   - piquer accélère, cabrer ralentit
 *   - roulis convertit en yaw (banked turn)
 *
 * Caméra : suivi 3e personne (derrière + au-dessus) avec lerp.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { ROOM_W, ROOM_D, WALL_H } from '@config';
import { cameraState } from './cameraState';

// ── Constantes physique ──────────────────────────────────────────────────────

const START_POS  = new THREE.Vector3(ROOM_W / 2, WALL_H + 250, ROOM_D / 2 + 200);
const MIN_Y      = 20;
const MAX_Y      = 2500;
const WORLD_X_MIN = -1500;
const WORLD_X_MAX = ROOM_W + 1500;
const WORLD_Z_MIN = -1500;
const WORLD_Z_MAX = ROOM_D + 1500;

const GRAVITY    = 30;

const SPEED_MIN  = 50;
const SPEED_MAX  = 450;
const SPEED_INIT = 130;
const SPEED_BOOST = 110;
const SPEED_BRAKE = 90;
const SPEED_DIVE  = 80;
const SPEED_DRAG  = 14;

const PITCH_RATE  = 1.6;
const ROLL_RATE   = 2.4;
const ROLL_TO_YAW = 1.2;
const PITCH_LIMIT = 1.2;
const ROLL_LIMIT  = 1.3;
const PITCH_DAMP  = 1.6;
const ROLL_DAMP   = 2.6;

const CAM_OFFSET = new THREE.Vector3(0, 30, 90);   // derrière (+Z local) + haut
const CAM_LOOK   = new THREE.Vector3(0, 0, -80);   // regarde devant (-Z local)
const CAM_LERP   = 0.18;

// ── Mesh avion en papier ─────────────────────────────────────────────────────

function PaperPlaneMesh() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const L = 30, W = 18, T = 18, H = 6;
    // Spine (fin) descend sous les ailes — comme un vrai avion en papier.
    const verts = new Float32Array([
      // Aile gauche (dessus)
      0, 0, -L,  -W, 0, T,   0, 0, T,
      // Aile droite (dessus)
      0, 0, -L,   0, 0, T,   W, 0, T,
      // Aile gauche (dessous)
      0, 0, -L,   0, 0, T,  -W, 0, T,
      // Aile droite (dessous)
      0, 0, -L,   W, 0, T,   0, 0, T,
      // Spine ventrale gauche
      0, 0, -L,   0,-H, T,   0, 0, T,
      // Spine ventrale droite
      0, 0, -L,   0, 0, T,   0,-H, T,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial
        color="#f5f5ee"
        side={THREE.DoubleSide}
        roughness={0.85}
        metalness={0}
      />
    </mesh>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export function PaperPlane({ onExit }: { onExit: () => void }) {
  const { camera, invalidate } = useThree();
  const planeRef = useRef<THREE.Group>(null!);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const flight = useRef({
    pos:   START_POS.clone(),
    yaw:   Math.PI,        // regard vers -Z initial (vers le séjour)
    pitch: -0.05,
    roll:  0,
    speed: SPEED_INIT,
    quat:  new THREE.Quaternion(),
  });
  const keys = useRef(new Set<string>());

  useEffect(() => {
    cameraState.mode = 'plane';
    keys.current.clear();

    const isPlaneKey = (k: string) =>
      ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(k);

    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onExitRef.current();
        return;
      }
      const k = e.key.toLowerCase();
      if (isPlaneKey(k)) {
        keys.current.add(k);
        e.preventDefault();
        invalidate();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);

    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
      cameraState.mode = 'orbit';
      keys.current.clear();
    };
  }, [invalidate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s  = flight.current;
    const k  = keys.current;

    // ── Lecture input ──
    let pitchIn = 0, rollIn = 0, throttleIn = 0;
    if (k.has('w') || k.has('arrowup'))    pitchIn -= 1;   // piquer (nose down)
    if (k.has('s') || k.has('arrowdown'))  pitchIn += 1;   // cabrer (nose up)
    // En YXZ : positive roll (e.z > 0) = bank gauche → tourne à gauche.
    // A / ← → bank gauche (positif) pour matcher le sens du virage.
    if (k.has('a') || k.has('arrowleft'))  rollIn  += 1;
    if (k.has('d') || k.has('arrowright')) rollIn  -= 1;
    if (k.has(' '))     throttleIn += 1;
    if (k.has('shift')) throttleIn -= 1;

    // ── Orientation ──
    s.pitch += pitchIn * PITCH_RATE * dt;
    s.roll  += rollIn  * ROLL_RATE  * dt;
    if (pitchIn === 0) s.pitch *= Math.max(0, 1 - PITCH_DAMP * dt);
    if (rollIn  === 0) s.roll  *= Math.max(0, 1 - ROLL_DAMP  * dt);
    s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch));
    s.roll  = Math.max(-ROLL_LIMIT,  Math.min(ROLL_LIMIT,  s.roll));
    // Banked turn : roll positif (bank gauche) → yaw positif (turn gauche).
    s.yaw += s.roll * ROLL_TO_YAW * dt;

    // YXZ : yaw, puis pitch, puis roll
    const euler = new THREE.Euler(s.pitch, s.yaw, s.roll, 'YXZ');
    s.quat.setFromEuler(euler);

    // ── Vitesse ──
    if (throttleIn > 0) s.speed += SPEED_BOOST * dt;
    if (throttleIn < 0) s.speed -= SPEED_BRAKE * dt;
    // Piquer (pitch < 0, nez vers le bas) accélère ; cabrer ralentit
    s.speed += -Math.sin(s.pitch) * SPEED_DIVE * dt;
    s.speed -= SPEED_DRAG * dt;
    s.speed  = Math.max(SPEED_MIN, Math.min(SPEED_MAX, s.speed));

    // ── Déplacement (forward = -Z local) ──
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(s.quat);
    s.pos.addScaledVector(fwd, s.speed * dt);
    s.pos.y -= GRAVITY * dt;

    // ── Clamp monde ──
    s.pos.x = Math.max(WORLD_X_MIN, Math.min(WORLD_X_MAX, s.pos.x));
    s.pos.z = Math.max(WORLD_Z_MIN, Math.min(WORLD_Z_MAX, s.pos.z));
    if (s.pos.y < MIN_Y) {
      s.pos.y = MIN_Y;
      // Sol → relève le nez et coupe la dive
      s.pitch = Math.max(s.pitch, 0.1);
    }
    if (s.pos.y > MAX_Y) s.pos.y = MAX_Y;

    // ── Application au mesh ──
    planeRef.current.position.copy(s.pos);
    planeRef.current.quaternion.copy(s.quat);

    // ── Suivi caméra 3e personne ──
    const off = CAM_OFFSET.clone().applyQuaternion(s.quat);
    const desired = s.pos.clone().add(off);
    camera.position.lerp(desired, CAM_LERP);
    const look = CAM_LOOK.clone().applyQuaternion(s.quat).add(s.pos);
    camera.lookAt(look);

    // ── Sync minimap ──
    cameraState.camX     = s.pos.x;
    cameraState.camZ     = s.pos.z;
    cameraState.camRY    = s.yaw;
    cameraState.planeX   = s.pos.x;
    cameraState.planeZ   = s.pos.z;
    cameraState.planeYaw = s.yaw;
    cameraState.onUpdate?.();

    invalidate();
  });

  return (
    <group ref={planeRef}>
      <PaperPlaneMesh />
    </group>
  );
}
