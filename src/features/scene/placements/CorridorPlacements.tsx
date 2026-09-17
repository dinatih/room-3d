import * as THREE from 'three';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from '../Building';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { CorridorCloset } from '../items/CorridorCloset';
import { TradfriBulb } from '../items/TradfriBulb';
import { Linky } from '../items/Linky';
import { Scooter } from '../items/Scooter';

import {
  ROOM_W,
  ROOM_D,
  WALL_H,
  KITCHEN_X1,
  KITCHEN_Z,
  DOOR_START,
} from '@config';
import { PARTITION_THICKNESS, pZ } from '../wallData';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

// Coffrage plastique vertical 25.5×6.5×WALL_H, contre mur est du couloir,
// début Z=ROOM_D+5 (5 cm du mur nord du couloir = mur sud séjour).
// Linky Enedis monté en façade à ~130 cm du sol.
const LINKY_GAINE_W   = 6.5;            // X — profondeur (depuis mur est)
const LINKY_GAINE_L   = 25.5;           // Z — largeur le long du mur
const LINKY_GAINE_Z0  = ROOM_D + 16;     // 416 — 6 cm de la face couloir du mur sud séjour (Z=ROOM_D+W=410)
const LINKY_GAINE_X1  = ROOM_W;         // colle au mur est (X=316)
const LINKY_GAINE_X0  = ROOM_W - LINKY_GAINE_W;
const LINKY_GAINE_CX  = (LINKY_GAINE_X0 + LINKY_GAINE_X1) / 2; // 312.75
const LINKY_GAINE_CZ  = LINKY_GAINE_Z0 + LINKY_GAINE_L / 2;    // 512.75
const LINKY_MOUNT_Y   = 170;            // hauteur base du Linky (bas du compteur)
const linkyGaineMat   = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.7, metalness: 0.05 });

function LinkyGaine() {
  return (
    <>
      {/* Coffrage plastique sol→plafond */}
      <mesh position={[LINKY_GAINE_CX, WALL_H / 2, LINKY_GAINE_CZ]} castShadow receiveShadow material={linkyGaineMat}>
        <boxGeometry args={[LINKY_GAINE_W, WALL_H, LINKY_GAINE_L]} />
      </mesh>
      {/* Linky face -X (vers le couloir). GLB front +Z → rotation-y = -π/2.
          Profondeur GLB ≈ 7.1 cm → recule Linky pour que son dos affleure la gaine. */}
      <group position={[LINKY_GAINE_X0 - 7.1 / 2, LINKY_MOUNT_Y, LINKY_GAINE_CZ]} rotation={[0, -Math.PI / 2, 0]}>
        <Linky item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

export function CorridorEquipment() {
  const as = useFurnitureToggles([
    'lamp-corridor-toggle',
    'corr-doors-toggle',
  ]);

  const CORR_CX = (DOOR_START + ROOM_W) / 2;
  const CORR_LAMP_Z = (pZ('corner-se') + pZ('diag-ne')) / 2;
  const lightsHD = useSceneStore((state) => state.layers.lightsHD);

  return (
    <MergedStaticGroup name="merged-corridor-equipment">
      {/* Ampoule Couloir (TRÅDFRI) */}
      <group
        position={[CORR_CX, WALL_H - 10, CORR_LAMP_Z]}
        rotation={[Math.PI, 0, 0]}
        userData={{ skipMerge: true, animUnit: true, itemName: 'Ampoule Couloir (TRÅDFRI)', hoverAction: { label: 'Ampoule Couloir (TRÅDFRI)', actions: ['lampCorridor'] } }}
      >
        <TradfriBulb item={stub('tradfri-bulb-couloir')} actionState={{ on: !!as['lamp-corridor-toggle'] }} onSize={NOOP_SIZE} />
        <pointLight
          position={[0, 20, 0]}
          intensity={as['lamp-corridor-toggle'] ? (lightsHD ? 120 : 2.5) : 0}
          distance={lightsHD ? 0 : 280}
          decay={lightsHD ? 1.0 : 2.0}
          color={0xfff5e6}
          castShadow={lightsHD}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.001}
          shadow-camera-near={1}
          shadow-camera-far={600}
        />
      </group>

      {/* Gaine plastique couloir mur est + Linky */}
      <LinkyGaine />

      {/* Placard Couloir */}
      <group position={[(KITCHEN_X1 + DOOR_START) / 2, 0, (ROOM_D + PARTITION_THICKNESS + KITCHEN_Z) / 2]} userData={{ animUnit: true, itemName: 'Placard Couloir' }}>
        <CorridorCloset item={stub('corridor-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function CorridorFurnishings() {
  return (
    <MergedStaticGroup name="merged-corridor-furnishings">
      {/* Trottinette Xiaomi */}
      <group position={[298, 0, 470]} rotation-y={Math.PI} userData={{ animUnit: true, itemName: 'Trottinette Xiaomi' }}>
        <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

export function CorridorFurniture() {
  return null;
}
