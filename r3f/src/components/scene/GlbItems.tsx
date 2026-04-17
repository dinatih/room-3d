/**
 * GlbItems.tsx — placement monde des objets GLB.
 * Les composants items/ gèrent tout le setup GLB (scale, centre, matériaux, shadows).
 * Les fonctions *Placed ici ne font que le positionnement monde via group.
 */
import { useMemo, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../utils/glbUtils';
import { Scooter }   from './items/Scooter';
import { Smorkull }  from './items/Smorkull';
import { LampOla }   from './items/LampOla';
import { Sunnersta } from './items/Sunnersta';
import { Mackapar }  from './items/Mackapar';
import { Salopette } from './items/Salopette';
import { BaseballCap } from './items/BaseballCap';

// @ts-ignore
import { ROOM_W, ROOM_D, NICHE_DEPTH } from '@config';

const NOOP_SIZE  = () => {};
const NOOP_ITEM  = {} as any;
const NOOP_STATE = {};

const kallaxW2      = 75.5;
const KALLAX_SE_Z   = ROOM_D - 60 - 40.5 / 2;  // 319.75
const KALLAX_SE_TOP = 2 * kallaxW2;             // 151
const MEUBLE_T_D   = 27.5;
const MEUBLE_T_H   = 55;
const MEUBLE_T_X   = ROOM_W - MEUBLE_T_D / 2;  // 286.25
const MEUBLE_T_Z   = KALLAX_SE_Z;              // 319.75
const MEUBLE_T_Y   = KALLAX_SE_TOP;            // 151

// Lampe orientée vers le centre du salon
const LAMP_ROT_Y = Math.atan2(ROOM_W / 2 - MEUBLE_T_X, ROOM_D / 2 - MEUBLE_T_Z);

// Centre monde du portant MACKAPÄR
// posX = -NICHE_DEPTH + PLINTHE + mackapar_depth/2 ≈ -10 + 3.5 + 38.5 = 32
// posZ = ROOM_D - kallaxW2 - 16 ≈ 308.5
const MACK_X = -NICHE_DEPTH + 3.5 + 38.5; // ≈ 32
const MACK_Z = ROOM_D - kallaxW2 - 16;    // ≈ 308.5
const RAIL_Y = 165;

// ── Trottinette Xiaomi ────────────────────────────────────────────────────────

function ScooterPlaced() {
  return (
    <group position={[282, 0, 460]} rotation-y={Math.PI}>
      <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Chaise SMÖRKULL ───────────────────────────────────────────────────────────

function SmorkullPlaced() {
  return (
    <group position={[30, 0, 151]} rotation-y={Math.PI / 2}>
      <Smorkull item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Lampe OLA ─────────────────────────────────────────────────────────────────

function LampOlaPlaced() {
  const [lampOn, setLampOn] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'lampOn') setLampOn(v => !v);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  return (
    <group
      position={[MEUBLE_T_X, MEUBLE_T_Y + MEUBLE_T_H, MEUBLE_T_Z]}
      rotation-y={LAMP_ROT_Y}
      userData={{ hoverAction: { label: 'Lampe OLA', actionId: 'lamp-toggle' } }}
    >
      <LampOla item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      {lampOn && <pointLight color={0xfff5e0} intensity={120000} distance={350} decay={2} position={[0, 96, 0]} />}
    </group>
  );
}

// ── Desserte SUNNERSTA ────────────────────────────────────────────────────────

function SunnerstaplPlaced() {
  return (
    <group position={[ROOM_W - 20, 0, 271.5]} rotation-y={Math.PI / 2}>
      <Sunnersta item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Portant MACKAPÄR + habits ─────────────────────────────────────────────────

function MackaparGroupPlaced() {
  return (
    <>
      {/* Portant — items/Mackapar gère scale + centre */}
      <group position={[MACK_X, 0, MACK_Z]} rotation-y={Math.PI / 2}>
        <Mackapar item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Salopette — items/Salopette gère scale + centre */}
      <group position={[MACK_X - 50, RAIL_Y - 120, MACK_Z]} rotation-y={Math.PI / 2}>
        <Salopette item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Casquettes baseball (mur B + mannequin Sunnersta) ────────────────────────

const SUNNERSTA_HEAD_TOP = 90 + 8 + 8 + 8.9 * 1.15; // ≈ 125.2 (world Y)

function BaseballCapsPlaced() {
  return (
    <>
      {/* Cap 1 — mur B au-dessus du lit (rx=π/2, rz=π/2) */}
      <group position={[297, 144, 173.5]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Cap 2 — tête mannequin Sunnersta (ry=π, scale×0.9) */}
      <group position={[282, SUNNERSTA_HEAD_TOP + 2, 271.5]} rotation-y={Math.PI}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Sneakers (2 paires devant mur D) ─────────────────────────────────────────

const MIRROR_CX = (130 + 190) / 2; // KITCHEN_X1=130, DOOR_START=190

function SneakersPlaced() {
  const { scene } = useGLTF('media/sneaker.glb');

  const clones = useMemo(() => {
    removeGlbLines(scene);
    const rawBox = new THREE.Box3().setFromObject(scene);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const longestH = Math.max(rawSize.x, rawSize.z);
    const s = 28 / longestH;
    const redM = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });

    function makeShoe() {
      const c = scene.clone(true);
      c.scale.setScalar(s);
      c.rotation.y = Math.PI / 2;
      c.traverse(m => {
        if ((m as THREE.Mesh).isMesh) {
          (m as THREE.Mesh).material = redM;
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      return c;
    }

    const shoeWid = rawSize.z * s;
    const GAP = 1;
    const localCX = (rawBox.min.x + rawBox.max.x) / 2 * s;
    const floorY = -rawBox.min.y * s;

    const l1 = makeShoe();
    l1.position.set(shoeWid / 2 + GAP / 2, floorY, localCX);
    const r1 = makeShoe();
    r1.scale.z *= -1;
    r1.position.set(-(shoeWid / 2 + GAP / 2), floorY, localCX);

    const l2 = makeShoe();
    l2.position.set(shoeWid / 2 + GAP / 2, floorY, localCX);
    const r2 = makeShoe();
    r2.scale.z *= -1;
    r2.position.set(-(shoeWid / 2 + GAP / 2), floorY, localCX);

    return { l1, r1, l2, r2, pairW: shoeWid * 2 + GAP };
  }, [scene]);

  const px = MIRROR_CX + 40 - 50;
  return (
    <>
      <group position={[px, 0, ROOM_D - 15]}>
        <primitive object={clones.l1} />
        <primitive object={clones.r1} />
      </group>
      <group position={[px + clones.pairW + 3, 0, ROOM_D - 15]}>
        <primitive object={clones.l2} />
        <primitive object={clones.r2} />
      </group>
    </>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function GlbItems() {
  return (
    <>
      <ScooterPlaced />
      <SmorkullPlaced />
      <LampOlaPlaced />
      <SunnerstaplPlaced />
      <MackaparGroupPlaced />
      <BaseballCapsPlaced />
      <SneakersPlaced />
    </>
  );
}

useGLTF.preload('media/sneaker.glb');
