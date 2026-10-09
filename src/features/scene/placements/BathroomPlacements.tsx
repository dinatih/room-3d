import { getObjectActionIds } from '../objectActions';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from '../Building';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';

import { WaterHeater, WH_W, WH_D, WH_H } from '../items/WaterHeater';
import { Toilet, TOILET_D } from '../items/Toilet';
import { Shower, SHOWER_W, SHOWER_D } from '../items/Shower';
import { Havback49514017, HAVBACK_D } from '../items/Havback49514017';
import { BathroomCabinetWest, BathroomCabinetEast } from '../items/BathroomCabinet';
import { SdbCloset, SDB_CLOSET_X, SDB_CLOSET_Z } from '../items/SdbCloset';
import { TradfriBulb } from '../items/TradfriBulb';
import { Vathult40467548 } from '../items/Vathult40467548';
import { GrassRug } from '../items/GrassRug';
import { Tackan } from '../items/Tackan';
import { Tisken40381253 } from '../items/Tisken40381253';
import { Fniss40295439, FNISS_D } from '../items/Fniss40295439';
import { DroneCell, DF } from '../items/Drona';

import { WALL_H, BATH_SOUTH_WALL, BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL, SHOWER_SOUTH_WALL } from '../wallData';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

const cbZ = BATH_NORTH_WALL + 19.5;

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

  const lightsHD = useSceneStore((state) => state.layers.lightsHD);

  return (
    <MergedStaticGroup name="merged-bathroom-equipment">
      {/* Chauffe-eau */}
      <group position={[BATH_WEST_WALL + WH_W / 2, WALL_H - 10 - WH_H / 2, BATH_NORTH_WALL + 11 + WH_D / 2]} rotation-y={Math.PI / 2} userData={{ side: 'west', itemName: 'Chauffe-eau' }}>
        <WaterHeater item={stub('water-heater')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Meuble Vasque SDB */}
      <group position={[BATH_EAST_WALL - 76, 14, BATH_NORTH_WALL + HAVBACK_D / 2]} userData={{ animUnit: true, itemName: 'Meuble Vasque SDB', hoverAction: { label: 'Lavabo Salle de bain', actions: SMART_OBJECTS['vasque-sdb'].slots.map(slot => `smart-object:::vasque-sdb:::${slot.slotId}`) } }}>
        <Havback49514017 item={stub('vasque-sdb')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* WC President */}
      <group position={[BATH_WEST_WALL + 60, 0, BATH_NORTH_WALL + TOILET_D / 2 + 1.5]} userData={{ skipMerge: true, animUnit: true, itemName: 'WC President', hoverAction: { label: 'WC President', actions: [...getObjectActionIds('toilet'), 'smart-object:::toilet:::use'] } }}>
        <Toilet item={stub('toilet')} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Ampoule SDB (TRÅDFRI) */}
      <group
        position={[(BATH_WEST_WALL + BATH_EAST_WALL) / 2, WALL_H - 10, (BATH_NORTH_WALL + BATH_SOUTH_WALL) / 2]}
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
      <group position={[BATH_EAST_WALL - 76, 176, BATH_NORTH_WALL - 2]} userData={{ animUnit: true, itemName: 'Bandeau LED Våthult' }}>
        <Vathult40467548 item={stub('vathult-350')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Cabine de Douche */}
      <group
        position={[BATH_WEST_WALL + SHOWER_W / 2, 0, SHOWER_SOUTH_WALL - SHOWER_D / 2]}
        userData={{
          skipMerge: true,
          animUnit: true,
          itemName: 'Cabine de Douche',
        }}
      >
        <Shower item={stub('shower')} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Placard SDB */}
      <group position={[SDB_CLOSET_X, 0, SDB_CLOSET_Z]} userData={{ animUnit: true, itemName: 'Placard SDB' }}>
        <SdbCloset item={stub('sdb-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 1 — Furniture (Structure & gros volumes)
export function BathroomFurniture() {
  const as = useFurnitureToggles(['cbn-west-toggle', 'cbn-east-toggle']);

  return (
    <MergedStaticGroup name="merged-bathroom-furniture">
      {/* Meubles SDB Ouest et Est */}
      <group position={[BATH_WEST_WALL + 20, 0, cbZ]} userData={{ animUnit: true, itemName: 'Meuble SDB Ouest' }}>
        <BathroomCabinetWest item={stub('bathroom-cabinet-west')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[BATH_EAST_WALL - 23, 0, cbZ]} userData={{ animUnit: true, itemName: 'Meuble SDB Est' }}>
        <BathroomCabinetEast item={stub('bathroom-cabinet-east')} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Poubelle Fniss SDB */}
      <group position={[110, 1, BATH_NORTH_WALL + FNISS_D / 2 + 1]} userData={{ animUnit: true, itemName: 'Poubelle Fniss SDB' }}>
        <Fniss40295439 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function BathroomFurnishings() {
  return (
    <MergedStaticGroup name="merged-bathroom-furnishings">
      {/* Tapis Gazon SDB */}
      <group position={[(BATH_WEST_WALL + BATH_EAST_WALL) / 2, 0, BATH_SOUTH_WALL - 53]} userData={{ animUnit: true, itemName: 'Tapis Gazon SDB' }}>
        <GrassRug item={stub('grass-rug')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Boîtes Drona sur meubles hauts SDB */}
      <group position={[BATH_EAST_WALL - 23, 60 + DF / 2 + 0.2, cbZ]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Boîte Drona SDB Est' }}>
        <DroneCell />
      </group>
      <group position={[BATH_WEST_WALL + 20, 60 + DF / 2 + 0.2, cbZ]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Boîte Drona SDB Ouest' }}>
        <DroneCell />
      </group>

      {/* TACKAN douche */}
      <group position={[BATH_WEST_WALL + 40, 80, BATH_SOUTH_WALL + 69]} userData={{ animUnit: true, itemName: 'Distributeur Tackan Douche' }}>
        <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* TACKAN lavabo */}
      <group position={[BATH_EAST_WALL - 61, 83, BATH_NORTH_WALL + 5]} userData={{ animUnit: true, itemName: 'Distributeur Tackan Lavabo' }}>
        <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* TISKEN sur miroir vasque */}
      <group position={[BATH_EAST_WALL - 98, 129, BATH_NORTH_WALL + 2.1]} rotation={[Math.PI / 2, 0, 0]} userData={{ animUnit: true, itemName: 'Crochet Tisken' }}>
        <Tisken40381253 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 3 — Decor (Détails & habillage de surface)
export function BathroomDecor() {
  return null;
}
