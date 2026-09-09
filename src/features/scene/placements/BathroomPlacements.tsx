import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from '../Building';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { WaterHeater } from '../items/WaterHeater';
import { Toilet } from '../items/Toilet';
import { Shower } from '../items/Shower';
import { Havback49514017 } from '../items/Havback49514017';
import { BathroomCabinetWest, BathroomCabinetEast } from '../items/BathroomCabinet';
import { SdbCloset } from '../items/SdbCloset';
import { TradfriBulb } from '../items/TradfriBulb';
import { Vathult40467548 } from '../items/Vathult40467548';
import { GrassRug } from '../items/GrassRug';
import { Tackan } from '../items/Tackan';
import { Tisken40381253 } from '../items/Tisken40381253';
import { Fniss40295439 } from '../items/Fniss40295439';
import { DroneCell } from '../items/Drona';

import {
  WALL_H,
  NICHE_X,
  KITCHEN_Z,
  BATH_Z_END,
  DOOR_START,
} from '@config';
import { PARTITION_THICKNESS } from '../wallData';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

const DF = 33;
const cbZ = KITCHEN_Z + PARTITION_THICKNESS + 19.5; // 486.7

export function BathroomEquipment() {
  const as = useFurnitureToggles([
    'lamp-bath-toggle',
    'sdb-closet-l-toggle',
    'sdb-closet-r-toggle',
    'shower-door-toggle',
    'wc-lid-toggle',
    'wc-seat-toggle',
    'wc-flush',
  ]);

  const HW_R = 28, HW_H = 65;
  const SDB_CX = (NICHE_X + DOOR_START) / 2;
  const SDB_CZ = (KITCHEN_Z + PARTITION_THICKNESS + BATH_Z_END) / 2;
  const lightsHD = useSceneStore((state) => state.layers.lightsHD);

  return (
    <MergedStaticGroup name="merged-bathroom-equipment">
      {/* Chauffe-eau */}
      <group position={[NICHE_X + HW_R, WALL_H - 10 - HW_H / 2, KITCHEN_Z + 20 + HW_R]} rotation-y={Math.PI / 2} userData={{ side: 'west', itemName: 'Chauffe-eau' }}>
        <WaterHeater item={stub('water-heater')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Meuble Vasque SDB */}
      <group position={[DOOR_START - 84, 14, KITCHEN_Z + PARTITION_THICKNESS + 24.5]} userData={{ animUnit: true, itemName: 'Meuble Vasque SDB' }}>
        <Havback49514017 item={stub('vasque-sdb')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* WC President */}
      <group position={[NICHE_X + 60, 0, KITCHEN_Z + PARTITION_THICKNESS + 36.5]} userData={{ skipMerge: true, animUnit: true, itemName: 'WC President', hoverAction: { label: 'WC President', actions: ['wc-lid-toggle', 'wc-seat-toggle', 'wc-flush'] } }}>
        <Toilet item={stub('toilet')} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Ampoule SDB (TRÅDFRI) */}
      <group
        position={[SDB_CX, WALL_H - 10, SDB_CZ]}
        rotation={[Math.PI, 0, 0]}
        userData={{ skipMerge: true, animUnit: true, itemName: 'Ampoule SDB (TRÅDFRI)', hoverAction: { label: 'Ampoule SDB (TRÅDFRI)', actions: ['lampBath'] } }}
      >
        <TradfriBulb item={stub('tradfri-bulb-sdb')} actionState={{ on: !!as['lamp-bath-toggle'] }} onSize={NOOP_SIZE} />
        <pointLight
          position={[0, 20, 0]}
          intensity={as['lamp-bath-toggle'] ? (lightsHD ? 120 : 2.5) : 0}
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

      {/* VÅTHULT — bandeau LED 35 cm au-dessus du miroir vasque */}
      <group position={[DOOR_START - 84, 176, KITCHEN_Z + PARTITION_THICKNESS - 2]} userData={{ itemName: 'Bandeau LED Våthult' }}>
        <Vathult40467548 item={stub('vathult-350')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Cabine de Douche */}
      <group position={[NICHE_X + 35, 0, KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2 + 35]} userData={{ animUnit: true, itemName: 'Cabine de Douche' }}>
        <Shower item={stub('shower')} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Placard SDB */}
      <group position={[130.3, 0, BATH_Z_END]} userData={{ animUnit: true, itemName: 'Placard SDB' }}>
        <SdbCloset item={stub('sdb-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

export function BathroomFurniture() {
  const as = useFurnitureToggles(['cbn-west-toggle', 'cbn-east-toggle']);

  return (
    <MergedStaticGroup name="merged-bathroom-furniture">
      {/* Tapis Gazon SDB */}
      <group position={[(NICHE_X + DOOR_START) / 2 - 5, 0, BATH_Z_END - 53]} userData={{ itemName: 'Tapis Gazon SDB' }}>
        <GrassRug item={stub('grass-rug')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Meubles SDB Ouest et Est */}
      <group position={[NICHE_X + 20, 0, cbZ]} userData={{ animUnit: true, itemName: 'Meuble SDB Ouest' }}>
        <BathroomCabinetWest item={stub('bathroom-cabinet-west')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[DOOR_START - 31, 0, cbZ]} userData={{ animUnit: true, itemName: 'Meuble SDB Est' }}>
        <BathroomCabinetEast item={stub('bathroom-cabinet-east')} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Boîtes Drona sur meubles hauts SDB */}
      <group position={[DOOR_START - 31, 60 + DF / 2 + 0.2, cbZ]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Boîte Drona SDB Est' }}>
        <DroneCell />
      </group>
      <group position={[NICHE_X + 20, 60 + DF / 2 + 0.2, cbZ]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Boîte Drona SDB Ouest' }}>
        <DroneCell />
      </group>

      {/* TACKAN douche */}
      <group position={[NICHE_X + 40, 80, BATH_Z_END + 69]} userData={{ itemName: 'Distributeur Tackan Douche' }}>
        <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* TACKAN lavabo */}
      <group position={[DOOR_START - 69, 83, KITCHEN_Z + PARTITION_THICKNESS + 5]} userData={{ itemName: 'Distributeur Tackan Lavabo' }}>
        <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* TISKEN sur miroir vasque */}
      <group position={[DOOR_START - 106, 129, KITCHEN_Z + PARTITION_THICKNESS + 2.1]} rotation={[Math.PI / 2, 0, 0]} userData={{ itemName: 'Crochet Tisken' }}>
        <Tisken40381253 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Poubelle Fniss SDB */}
      <group position={[110, 1, 500]} userData={{ animUnit: true, itemName: 'Poubelle Fniss SDB' }}>
        <Fniss40295439 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}
