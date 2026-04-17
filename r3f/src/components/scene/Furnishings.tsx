/**
 * Furnishings.tsx — Meubles principaux avec état (lit, bureaux, TV).
 * Port de js/furniture/bed.js, desks.js et tv.js.
 */
import { useMemo, useState, useEffect } from 'react';
import { LaptopDesk }     from './LaptopDesk';
import { TV, TV_H }       from './items/TV';
import { UtakerFrame }    from './items/UtakerFrame';
import { BollsidanDesk }  from './items/BollsidanDesk';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '../../utils/sceneItem';

// @ts-ignore
import { ROOM_W, WALL_H, KALLAX_DEPTH } from '@config';

// ── Constantes partagées ──────────────────────────────────────────────────────

const kallaxW2       = 75.5;
const SUNNERSTA_NW_X = ROOM_W - 36;   // 264
const SUNNERSTA_NW_Z = 243.5;

const SIT_H   = 70;
const STAND_H = 103;

// ────────────────────────────────────────────────────────────────────────────
// LIT UTÅKER
// ────────────────────────────────────────────────────────────────────────────

function Bed() {
  const bedPositions = useMemo(() => {
    const PAD = 3;
    const halfL = 102.5, halfW = 41.5;
    const dxK = ROOM_W - (ROOM_W - KALLAX_DEPTH);
    const dxS = ROOM_W - SUNNERSTA_NW_X + PAD;
    const dzT = SUNNERSTA_NW_Z - (kallaxW2 + PAD);
    const u = (dzT - Math.sqrt(dzT * dzT - 4 * dxK * dxS)) / 2;
    const NE_Z  = kallaxW2 + PAD + u;
    const alpha = Math.atan2(dxK, u);
    const neOffX = halfL * Math.cos(alpha) + halfW * Math.sin(alpha);
    const neOffZ = -halfL * Math.sin(alpha) + halfW * Math.cos(alpha);
    return [
      { x: ROOM_W - neOffX,  z: NE_Z - neOffZ, ry: alpha       }, // pos 0 — diagonale
      { x: ROOM_W - 83 / 2,  z: 190,           ry: Math.PI / 2 }, // pos 1 — ∥ mur B
      { x: ROOM_W - 205 / 2, z: 200,           ry: 0           }, // pos 2 — ⊥ mur B
    ];
  }, []);

  const [stacked,   setStacked]   = useState(true);
  const [sofa,      setSofa]      = useState(false);
  const [bedPosIdx, setBedPosIdx] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'bed-toggle'    || key === 'bedStacked')   setStacked(v => !v);
      if (key === 'bed-sofa'      || key === 'bedSofa')      setSofa(v => !v);
      if (key === 'bed-position'  || key === 'bedPosition')  { setSofa(false); setBedPosIdx(i => (i + 1) % 3); }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p    = bedPositions[bedPosIdx];
  const gPos: [number, number, number] = sofa ? [ROOM_W - 83 / 2, 0, 190]   : [p.x, 0, p.z];
  const gRy  = sofa ? Math.PI / 2 : p.ry;
  const b2Pos: [number, number, number] = sofa
    ? [46, 0, -(ROOM_W - 83)]
    : [0, stacked ? 23 : 0, stacked ? 0 : -83];

  return (
    <group
      position={gPos}
      rotation={[0, gRy, 0]}
      userData={{ hoverAction: { label: 'Lit Utåker', actions: ['bed-toggle', 'bed-position', 'bed-sofa'] } }}
    >
      <UtakerFrame item={{ id: 'utaker-lower' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      <group position={b2Pos}>
        <UtakerFrame item={{ id: 'utaker-upper' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BUREAUX BOLLSIDAN
// ────────────────────────────────────────────────────────────────────────────

const DESK1_POSITIONS = [
  { x: 22,   z: 74.5, ry: Math.PI / 2 },
  { x: 73.5, z: 18,   ry: 0           },
] as const;

const DESK2_POSITIONS = [
  { x: 200, z: 170, ry: Math.PI     },
  { x: 85,  z: 151, ry: Math.PI / 2 },
] as const;

function Desks() {
  const [d1H,   setD1H]   = useState(SIT_H);
  const [d2H,   setD2H]   = useState(SIT_H);
  const [d1Pos, setD1Pos] = useState(0);
  const [d2Pos, setD2Pos] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'desk1-toggle')   setD1H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk1-position') setD1Pos(i => (i + 1) % DESK1_POSITIONS.length);
      if (key === 'desk2-toggle')   setD2H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk2-position') setD2Pos(i => (i + 1) % DESK2_POSITIONS.length);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p1 = DESK1_POSITIONS[d1Pos];
  const p2 = DESK2_POSITIONS[d2Pos];

  return (
    <>
      <group
        position={[p1.x, 0, p1.z]} rotation={[0, p1.ry, 0]}
        userData={{ hoverAction: { label: 'Bureau 1', actions: ['desk1-toggle', 'desk1-position'] } }}
      >
        <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d1H} />
      </group>
      <group
        position={[p2.x, 0, p2.z]} rotation={[0, p2.ry, 0]}
        userData={{ hoverAction: { label: 'Bureau 2', actions: ['desk2-toggle', 'desk2-position'] } }}
      >
        <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d2H} />
        <group position={[0, d2H, 0]} rotation={[0, Math.PI, 0]}>
          <LaptopDesk />
        </group>
      </group>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TÉLÉVISEUR
// ────────────────────────────────────────────────────────────────────────────

function TVPlaced() {
  const TV_Y = WALL_H - 10 - TV_H / 2;
  return (
    <group
      position={[ROOM_W - 25, TV_Y, 25]}
      rotation-order="YXZ"
      rotation={[-Math.PI / 36, (3 * Math.PI) / 4, 0]}
    >
      <TV item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Furnishings() {
  return (
    <>
      <Bed />
      <Desks />
      <TVPlaced />
    </>
  );
}
