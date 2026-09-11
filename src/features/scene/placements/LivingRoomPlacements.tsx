import { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from '../Building';
import { positionState } from '@features/scene/positionState';
import { PositionTransition } from '../utils/PositionTransition';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { KallaxNE } from '../items/KallaxNE';
import { KallaxSE } from '../items/KallaxSE';
import { KallaxNW } from '../items/KallaxNW';
import { JblCharge3 } from '../items/JblCharge3';
import { MackaparGroup } from '../items/MackaparGroup';
import { MannequinHead } from '../items/MannequinHead';
import { GoogleNestMini } from '../items/GoogleNestMini';
import { Mulig30179435 } from '../items/Mulig30179435';
import { Smorkull } from '../items/Smorkull';
import { SneakersRed } from '../items/SneakersRed';
import { Grejig40329868 } from '../items/Grejig40329868';
import { Stackstod60620144 } from '../items/Stackstod60620144';
import { Lagerpoppel00561816 } from '../items/Lagerpoppel00561816';
import { MaillotInyeong } from '../items/MaillotInyeong';
import { Spruttig20317079 } from '../items/Spruttig20317079';
import { PalmLeaf } from '../items/PalmLeaf';
import { Laptop } from '../items/Laptop';
import { Phone } from '../items/Phone';
import { Kejserlig90511501 } from '../items/Kejserlig90511501';
import { Backpack } from '../items/Backpack';
import { DroneCell } from '../items/Drona';
import { Dimpa10056770 } from '../items/Dimpa10056770';
import { Lack90282180 } from '../items/Lack90282180';
import { LampOla } from '../items/LampOla';
import { UtakerFrame } from '../items/UtakerFrame';
import { Nasfjallet10558045 } from '../items/Nasfjallet10558045';
import { Bollsidan30574370 } from '../items/Bollsidan30574370';
import { AirPerformer } from '../items/AirPerformer';
import { Fniss40295439 } from '../items/Fniss40295439';
import { TV, TV_H } from '../items/TV';
import { MllseG2Pro } from '../items/MllseG2Pro';

import {
  ROOM_W,
  ROOM_D,
  WALL_H,
  NICHE_Z_START,
} from '@config';

import {
  DESK1_POSITIONS,
  DESK2_POSITIONS,
  SMORKULL_POSITIONS,
  AIRPERFORMER_POSITIONS,
  DOUBLE_BED_POSITIONS,
} from '../furniturePositions';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

const w1 = 40.5; // 1×Kallax : 33.5 + 2×3.5
const w2 = 75.5; // 2×Kallax : 2×33.5 + 2×3.5 + 1.5

const KALLAX_DEPTH = 39;
const KALLAX_SE_Z = ROOM_D - 60 - w1 / 2; // 319.75
const KALLAX_SE_TOP = 2 * w2; // 151

const lackY = 187.5;
const lackCX = 13;
const lackCZ = NICHE_Z_START - 55;
const lackTopY = lackY + 5;
const mannRot = Math.atan2(150 - lackCX, 200 - lackCZ);

const MUL_D = 13;
const mulCZ = NICHE_Z_START - 150;

const MEUBLE_T_X = ROOM_W - 13.75;
const MEUBLE_T_Z = KALLAX_SE_Z;
const MEUBLE_T_Y = KALLAX_SE_TOP + 50; // dessus kallax SE + freezer

const LAMP_ROT_Y = Math.atan2(ROOM_W / 2 - MEUBLE_T_X, ROOM_D / 2 - MEUBLE_T_Z);
const MACK_X = 32; // contre le mur Ouest en tenant compte de la profondeur du meuble et de l'alignement
const MACK_Z = ROOM_D - w2 - 16;
const MIRROR_CX = 160;

const SIT_H = 70;
const STAND_H = 103;

function AnimatedTopper({
  isDouble,
  westPos,
  eastPos,
}: {
  isDouble: boolean;
  westPos: { x: number; z: number };
  eastPos: { x: number; z: number };
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  const targetX = isDouble ? eastPos.x : westPos.x;
  const targetY = isDouble ? 29 : 35;
  const targetZ = isDouble ? eastPos.z : westPos.z;

  const current = useRef({ x: targetX, y: targetY, z: targetZ });
  const initialized = useRef(false);

  const prevIsDouble = useRef(isDouble);
  const transferProgress = useRef(0);
  const isTransferring = useRef(false);

  useEffect(() => {
    if (initialized.current && prevIsDouble.current !== isDouble) {
      isTransferring.current = true;
      transferProgress.current = 1;
    }
    prevIsDouble.current = isDouble;
  }, [isDouble]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    if (!initialized.current) {
      initialized.current = true;
      current.current = { x: targetX, y: targetY, z: targetZ };
      g.position.set(targetX, targetY, targetZ);
      return;
    }

    const c = current.current;
    const dx = targetX - c.x;
    const dz = targetZ - c.z;
    const dy = targetY - c.y;

    const SPEED = 0.09;
    const SNAP_POS = 0.4;

    if (Math.abs(dx) > SNAP_POS || Math.abs(dz) > SNAP_POS || Math.abs(dy) > SNAP_POS) {
      c.x += dx * SPEED;
      c.z += dz * SPEED;
      c.y += dy * SPEED;

      let arc = 0;
      if (isTransferring.current) {
        const distHoriz = Math.hypot(dx, dz);
        arc = Math.min(distHoriz * 0.35, 25);
        if (distHoriz <= SNAP_POS) {
          isTransferring.current = false;
        }
      }

      g.position.set(c.x, c.y + arc, c.z);
      invalidate();
    } else {
      c.x = targetX;
      c.y = targetY;
      c.z = targetZ;
      isTransferring.current = false;
      g.position.set(targetX, targetY, targetZ);
    }
  });

  return (
    <group ref={groupRef} rotation-y={0}>
      <Nasfjallet10558045 item={stub('nasfjallet-topper')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function Beds() {
  const toggles = useFurnitureToggles(['bed-double']);
  const isDouble = !!toggles['bed-double'];
  const [doublePosIdx, setDoublePosIdx] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'bed-position') {
        setDoublePosIdx(i => {
          const next = (i + 1) % DOUBLE_BED_POSITIONS.length;
          positionState['bed-position'] = { idx: next, total: DOUBLE_BED_POSITIONS.length };
          positionState['bed-west-position'] = { idx: isDouble ? next : -1, total: DOUBLE_BED_POSITIONS.length };
          positionState['bed-east-position'] = { idx: isDouble ? next : -1, total: DOUBLE_BED_POSITIONS.length };
          return next;
        });
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [isDouble]);

  useEffect(() => {
    positionState['bed-position'] = { idx: doublePosIdx, total: DOUBLE_BED_POSITIONS.length };
    positionState['bed-double'] = { idx: isDouble ? 1 : 0, total: 2 };
    positionState['bed-west-position'] = { idx: isDouble ? doublePosIdx : -1, total: DOUBLE_BED_POSITIONS.length };
    positionState['bed-east-position'] = { idx: isDouble ? doublePosIdx : -1, total: DOUBLE_BED_POSITIONS.length };
  }, [doublePosIdx, isDouble]);

  const currentDoublePos = DOUBLE_BED_POSITIONS[doublePosIdx];

  const westPos = isDouble
    ? currentDoublePos.west
    : { x: 74, z: 151.5 };

  const eastPos = isDouble
    ? currentDoublePos.east
    : { x: ROOM_W - 45.5, z: 190 };

  const hoverActions = isDouble ? ['bed-double', 'bed-position'] : ['bed-double'];
  const hoverLabel = isDouble
    ? `Lit Utåker Double (${currentDoublePos.label})`
    : 'Lit Utåker (Lits séparés)';

  return (
    <>
      <PositionTransition x={westPos.x} z={westPos.z} ry={Math.PI / 2}>
        <group userData={{ animUnit: true, hoverAction: { label: hoverLabel, actions: hoverActions } }}>
          <UtakerFrame item={{ id: 'utaker-upper' } as any} hasTopper={!isDouble} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </PositionTransition>

      <PositionTransition x={eastPos.x} z={eastPos.z} ry={Math.PI / 2}>
        <group userData={{ animUnit: true, hoverAction: { label: hoverLabel, actions: hoverActions } }}>
          <UtakerFrame item={{ id: 'utaker-lower' } as any} hasTopper={isDouble} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </PositionTransition>

      <AnimatedTopper isDouble={isDouble} westPos={westPos} eastPos={eastPos} />
    </>
  );
}

function Desks() {
  const [d1H, setD1H] = useState(SIT_H);
  const [d2H, setD2H] = useState(STAND_H);
  const [d1Pos, setD1Pos] = useState(0);
  const [d2Pos, setD2Pos] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'desk1-toggle') setD1H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk1-position') {
        setD1Pos(i => {
          const next = (i + 1) % DESK1_POSITIONS.length;
          positionState['desk1-position'] = { idx: next, total: DESK1_POSITIONS.length };
          return next;
        });
      }
      if (key === 'desk2-toggle') setD2H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk2-position') {
        setD2Pos(i => {
          const next = (i + 1) % DESK2_POSITIONS.length;
          positionState['desk2-position'] = { idx: next, total: DESK2_POSITIONS.length };
          return next;
        });
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  useEffect(() => { positionState['desk1-position'] = { idx: d1Pos, total: DESK1_POSITIONS.length }; }, [d1Pos]);
  useEffect(() => { positionState['desk2-position'] = { idx: d2Pos, total: DESK2_POSITIONS.length }; }, [d2Pos]);

  const p1 = DESK1_POSITIONS[d1Pos];
  const p2 = DESK2_POSITIONS[d2Pos];

  return (
    <>
      <PositionTransition x={p1.x} z={p1.z} ry={p1.ry}>
        <group userData={{ hoverAction: { label: 'Bureau 1', actions: ['desk1-toggle', 'desk1-position'] } }}>
          <group userData={{ animUnit: true }}>
            <Bollsidan30574370 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d1H} />
          </group>
          <group position={[0, d1H, 0]} rotation={[0, Math.PI, 0]}>
            <group position={[0, 0, 0]} userData={{ animUnit: true, itemName: 'Organiseur STACKSTOD Bureau 1' }}>
              <Stackstod60620144 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
            </group>
          </group>
        </group>
      </PositionTransition>
      <PositionTransition x={p2.x} z={p2.z} ry={p2.ry}>
        <group userData={{ hoverAction: { label: 'Bureau 2', actions: ['desk2-toggle', 'desk2-position'] } }}>
          <group userData={{ animUnit: true }}>
            <Bollsidan30574370 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d2H} />
          </group>
          <group position={[0, d2H, -8]} rotation={[0, Math.PI, 0]}>
            <group userData={{ animUnit: true }}>
              <Laptop item={{} as any} actionState={{}} onSize={() => {}} />
            </group>
            <group userData={{ animUnit: true }}>
              <group position={[22, 0, 2]} rotation={[0, 0.15, 0]}>
                <Phone item={{} as any} actionState={{}} onSize={() => {}} />
              </group>
            </group>
            <group userData={{ animUnit: true }}>
              <group position={[-22, 0, -7]}>
                <Kejserlig90511501 item={{} as any} actionState={{}} onSize={() => {}} />
              </group>
            </group>
          </group>
        </group>
      </PositionTransition>
    </>
  );
}

function Smorkull_() {
  const [posIdx, setPosIdx] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'smorkull-position') {
        setPosIdx(i => {
          const next = (i + 1) % SMORKULL_POSITIONS.length;
          positionState['smorkull-position'] = { idx: next, total: SMORKULL_POSITIONS.length };
          return next;
        });
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  useEffect(() => { positionState['smorkull-position'] = { idx: posIdx, total: SMORKULL_POSITIONS.length }; }, [posIdx]);
  const p = SMORKULL_POSITIONS[posIdx];
  return (
    <PositionTransition x={p.x} z={p.z} ry={p.ry}>
      <group userData={{ skipMerge: true, animUnit: true, itemName: 'Smörkull', hoverAction: { label: 'Smörkull', actionId: 'smorkull-position' } }}>
        <Smorkull item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </PositionTransition>
  );
}

function AirPerformer_() {
  const [posIdx, setPosIdx] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'airperformer-position') {
        setPosIdx(i => {
          const next = (i + 1) % AIRPERFORMER_POSITIONS.length;
          positionState['airperformer-position'] = { idx: next, total: AIRPERFORMER_POSITIONS.length };
          return next;
        });
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  useEffect(() => { positionState['airperformer-position'] = { idx: posIdx, total: AIRPERFORMER_POSITIONS.length }; }, [posIdx]);
  const p = AIRPERFORMER_POSITIONS[posIdx];
  return (
    <PositionTransition x={p.x} z={p.z} ry={p.ry}>
      <group userData={{ skipMerge: true, animUnit: true, itemName: 'Air Performer', hoverAction: { label: 'Air Performer', actions: ['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed', 'airperformer-position'] } }}>
        <AirPerformer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </PositionTransition>
  );
}

function LampOla_() {
  const as = useFurnitureToggles(['lamp-toggle']);
  const lampOn = !!as['lamp-toggle'];
  const lightsHD = useSceneStore((state) => state.layers.lightsHD);
  const [targetObj, setTargetObj] = useState<THREE.Object3D | null>(null);

  return (
    <>
      <group position={[MEUBLE_T_X, MEUBLE_T_Y, MEUBLE_T_Z - 10]} rotation-y={LAMP_ROT_Y}
        userData={{ skipMerge: true, animUnit: true, itemName: 'Lampe OLA', hoverAction: { label: 'Lampe OLA', actionId: 'lamp-toggle' } }}>
        <LampOla item={NOOP_ITEM} actionState={{ on: lampOn }} onSize={NOOP_SIZE} />
        <object3D ref={setTargetObj} position={[0, 250, 15]} />
        {targetObj && (
          <spotLight
            target={targetObj}
            position={[0, 100, 0]}
            angle={Math.PI / 3.2}
            penumbra={0.7}
            intensity={lampOn && lightsHD ? 350 : 0}
            distance={0}
            decay={1.0}
            color={0xfff2dc}
            castShadow={lightsHD}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.001}
            shadow-camera-near={5}
            shadow-camera-far={800}
          />
        )}
        <pointLight
          position={[0, 96, 0]}
          intensity={lampOn ? (lightsHD ? 35 : 3.5) : 0}
          distance={lightsHD ? 180 : 350}
          decay={lightsHD ? 1.5 : 2.0}
          color={0xfff2dc}
        />
      </group>
      <group position={[MEUBLE_T_X, MEUBLE_T_Y, MEUBLE_T_Z + 10]} rotation-y={LAMP_ROT_Y - Math.PI / 8} userData={{ skipMerge: true, itemName: 'Tête de mannequin 5', hoverAction: { label: 'Tête de mannequin 5', actions: ['mannequin-lamp-random', 'mannequin-lamp-wig', 'mannequin-lamp-color', 'mannequin-lamp-wind'] } }}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} mannequinId="lamp" />
      </group>
    </>
  );
}

function SneakersPair() {
  const pz = ROOM_D - 16;
  return (
    <>
      <group position={[MIRROR_CX, 0.5, pz]} userData={{ animUnit: true, itemName: 'Baskets Sneakers Rouges Bas' }}>
        <SneakersRed item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[MIRROR_CX, 18.5, pz]} userData={{ animUnit: true, itemName: 'Baskets Sneakers Rouges Haut' }}>
        <SneakersRed item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

function CeilingPalmLeaves() {
  const placements = useMemo(() => Array.from({ length: 1 }, () => ({
    x: 40 + Math.random() * (ROOM_W - 80),
    z: 40 + Math.random() * (ROOM_D - 80),
    ry: Math.random() * Math.PI * 2,
  })), []);
  return (
    <>
      {placements.map((p, i) => (
        <group key={i} position={[p.x, WALL_H, p.z]} rotation={[Math.PI, p.ry, 0]} userData={{ animUnit: true, itemName: 'Feuilles Palmier Plafond' }}>
          <PalmLeaf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
    </>
  );
}

export function LivingRoomPlacements() {
  const TV_Y = WALL_H - 10 - TV_H / 2;
  const as = useFurnitureToggles(['tv-toggle']);
  const DF = 33;

  return (
    <MergedStaticGroup name="merged-living-room">
      {/* Meubles Kallax */}
      <group position={[KALLAX_DEPTH / 2, 0, w1 / 2]} rotation={[0, -Math.PI / 2, 0]} userData={{ itemName: 'Kallax NW' }}>
        <KallaxNW item={stub('kallax-nw-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, w2 / 2]} rotation={[0, Math.PI / 2, 0]} userData={{ itemName: 'Kallax NE' }}>
        <KallaxNE item={stub('kallax-ne-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[ROOM_W - KALLAX_DEPTH / 2 - 15, 118, w2 - 11]} userData={{ itemName: 'Enceinte JBL Charge 3' }}>
        <JblCharge3 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[ROOM_W - 14, 118, w2 - 11]} rotation-y={-Math.PI / 4} userData={{ skipMerge: true, itemName: 'Tête de mannequin 2', hoverAction: { label: 'Tête de mannequin 2', actions: ['mannequin-kallax-ne-random', 'mannequin-kallax-ne-wig', 'mannequin-kallax-ne-color', 'mannequin-kallax-ne-wind'] } }}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} mannequinId="kallax-ne" />
      </group>

      <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, KALLAX_SE_Z]} rotation={[0, Math.PI / 2, 0]} userData={{ itemName: 'Kallax SE' }}>
        <KallaxSE item={stub('kallax-se-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Sacs Dimpa mur Ouest */}
      <group position={[16, 0, 155]} rotation-y={Math.PI / 2} userData={{ itemName: 'Sac Dimpa Ouest 1' }}>
        <Dimpa10056770 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[16, 0, 220]} rotation-y={Math.PI / 2} userData={{ itemName: 'Sac Dimpa Ouest 2' }}>
        <Dimpa10056770 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Drona au sol mur Ouest */}
      <group position={[16.5, DF / 2 + 0.2, 268]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Boîte Drona Sol Ouest' }}>
        <DroneCell />
      </group>

      {/* Sac à dos */}
      <group position={[17 / 2, 138, 258]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Sac à Dos' }}>
        <Backpack item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Lits et Bureaux */}
      <Beds />
      <Desks />

      {/* TV */}
      <group position={[ROOM_W - 28, TV_Y, 50]} rotation-order="YXZ"
        rotation={[-Math.PI / 36, (3 * Math.PI) / 4, 0]} userData={{ itemName: 'Téléviseur' }}>
        <TV item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Mini PC */}
      <group position={[ROOM_W - 25, 40, 30]} userData={{ itemName: 'Mini PC MLLSE' }}>
        <MllseG2Pro item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Étagère Lack + mannequin */}
      <group position={[lackCX, lackY, lackCZ]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Étagère Lack' }}>
        <Lack90282180 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[lackCX, lackTopY, lackCZ]} rotation={[0, mannRot, 0]} userData={{ skipMerge: true, itemName: 'Tête de mannequin 4', hoverAction: { label: 'Tête de mannequin 4', actions: ['mannequin-lack-random', 'mannequin-lack-wig', 'mannequin-lack-color', 'mannequin-lack-wind'] } }}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} mannequinId="lack" />
      </group>

      {/* Penderie Mulig */}
      <group position={[MUL_D, 222, mulCZ]} rotation={[0, 0, 0]} userData={{ animUnit: true, itemName: 'Penderie Mulig' }}>
        <Mulig30179435 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Google Nest Mini */}
      <group position={[7, 105, 90.5]} rotation={[-Math.PI / 2, 0, 0]} userData={{ itemName: 'Google Nest Mini' }}>
        <GoogleNestMini item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Poubelle Fniss Séjour */}
      <group position={[21, 1, 110]} userData={{ animUnit: true, itemName: 'Poubelle Fniss Séjour' }}>
        <Fniss40295439 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Fauteuil Smörkull & Air Performer */}
      <Smorkull_ />
      <AirPerformer_ />

      {/* Lampe Ola */}
      <LampOla_ />

      {/* Meuble Mackapär */}
      <group position={[MACK_X, 0, MACK_Z]} rotation-y={Math.PI / 2} userData={{ itemName: 'Meuble Mackapär' }}>
        <MackaparGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Rangement chaussures Grejig & Baskets */}
      <SneakersPair />
      {[0, 18, 36].map(y => (
        <group key={y} position={[MIRROR_CX, y, ROOM_D - 14]} userData={{ animUnit: true, itemName: `Range-chaussures Grejig ${y / 18 + 1}` }}>
          <Grejig40329868 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}

      {/* Coussins Lagerpoppel mur Est */}
      <group position={[ROOM_W - 10, WALL_H, ROOM_D / 2 - 38]} rotation={[0, -Math.PI / 2, -0.967]} userData={{ animUnit: true, itemName: 'Coussin LAGERPOPPEL 1 (Mur Est Nord)' }}>
        <group position={[29, -40, 0]}>
          <Lagerpoppel00561816 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>
      <group position={[ROOM_W - 10, WALL_H, ROOM_D / 2 + 38]} rotation={[0, -Math.PI / 2, 0.967]} userData={{ animUnit: true, itemName: 'Coussin LAGERPOPPEL 2 (Mur Est Sud)' }}>
        <group position={[-29, -40, 0]}>
          <Lagerpoppel00561816 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>

      {/* Maillot de foot Coréen Inyeong suspendu sur cintre au mur Est entre les 2 coussins (dos visible vers la pièce) */}
      <group
        position={[ROOM_W - 1.2, 212, ROOM_D / 2]}
        rotation={[0, Math.PI / 2, 0]}
        userData={{ animUnit: true, itemName: 'Maillot Coréen - Inyeong', skipMerge: true }}
      >
        {/* Petit piton/crochet mural discret */}
        <mesh position={[0, 18.5, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 1.6, 8]} />
          <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.8} />
        </mesh>
        <Spruttig20317079 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        <MaillotInyeong />
      </group>

      {/* Décor plafond */}
      <CeilingPalmLeaves />
    </MergedStaticGroup>
  );
}
