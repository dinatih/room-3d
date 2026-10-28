import { NavigationObstacle } from '../ai/navigation/NavigationObstacle';
import { getObjectActionIds } from '../objectActions';
import { useLightAppearance } from '../../home-assistant/useLightAppearance';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from '../Building';
import { NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';

import { WaterHeater, WH_W, WH_D, WH_H } from '../items/WaterHeater';
import { Toilet, TOILET_W, TOILET_D } from '../items/Toilet';
import { Shower, SHOWER_W, SHOWER_D } from '../items/Shower';
import { Havback49514017, HAVBACK_D } from '../items/Havback49514017';
import { BathroomCabinetWest, BathroomCabinetEast } from '../items/BathroomCabinet';
import { SdbCloset, SDB_CLOSET_X, SDB_CLOSET_Z } from '../items/SdbCloset';
import { TradfriBulb } from '../items/TradfriBulb';
import { Vathult40467548 } from '../items/Vathult40467548';
import { GrassRug } from '../items/GrassRug';
import { Tackan } from '../items/Tackan';
import { Tisken40381253 } from '../items/Tisken40381253';
import { OneBlade } from '../items/OneBlade';
import { OralBToothbrush } from '../items/OralBToothbrush';
import { Fniss40295439, FNISS_D } from '../items/Fniss40295439';
import { DroneCell } from '../items/Drona';
import { BATHROOM_STORAGE_ITEMS } from '../items/bathroomStorage';

import { WALL_H, BATH_SOUTH_WALL, BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL, SHOWER_SOUTH_WALL } from '../wallData';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

// Retrait de 5 cm sur chaque bord pour dégager l'accès aux meubles et boîtes DRÖNA.
const TOILET_OBSTACLE_INSET = 5;
const TOILET_FOOTPRINT = [
  { x: -TOILET_W / 2 + TOILET_OBSTACLE_INSET, z: -TOILET_D / 2 + TOILET_OBSTACLE_INSET },
  { x: TOILET_W / 2 - TOILET_OBSTACLE_INSET, z: -TOILET_D / 2 + TOILET_OBSTACLE_INSET },
  { x: TOILET_W / 2 - TOILET_OBSTACLE_INSET, z: TOILET_D / 2 - TOILET_OBSTACLE_INSET },
  { x: -TOILET_W / 2 + TOILET_OBSTACLE_INSET, z: TOILET_D / 2 - TOILET_OBSTACLE_INSET },
];

export function BathroomEquipment() {
  const { name, color, brightness } = useLightAppearance('lampBath', 0xfff5e6);
  const as = useFurnitureToggles([
    'lamp-bath-toggle',
    'sdbClosetL',
    'sdbClosetR',
    'wc-lid-toggle',
    'wc-seat-toggle',
    'wc-flush',
  ]);

  const lightsHD = useSceneStore((state) => state.layers.lightsHD);

  return (
    <MergedStaticGroup name="merged-bathroom-equipment">
      {/* Chauffe-eau */}
      <group position={[BATH_WEST_WALL + WH_W / 2, WALL_H - 10 - WH_H / 2, BATH_NORTH_WALL + 11 + WH_D / 2]} rotation-y={Math.PI / 2} userData={{ side: 'west', itemName: 'Chauffe-eau' }}>
        <WaterHeater />
      </group>

      {/* Meuble Vasque SDB */}
      <group position={[BATH_EAST_WALL - 76, 14, BATH_NORTH_WALL + HAVBACK_D / 2]} userData={{ sceneItemRoot: true, itemName: 'Meuble Vasque SDB', hoverAction: { label: 'Lavabo Salle de bain', actions: SMART_OBJECTS['vasque-sdb'].slots.map(slot => `smart-object:::vasque-sdb:::${slot.slotId}`) } }}>
        <NavigationObstacle id="vasque-sdb"><Havback49514017 /></NavigationObstacle>
      </group>

      {/* WC President */}
      <group position={[BATH_WEST_WALL + 60, 1, BATH_NORTH_WALL + TOILET_D / 2 + 1.5]} userData={{ skipMerge: true, sceneItemRoot: true, itemName: 'WC President', hoverAction: { label: 'WC President', actions: [...getObjectActionIds('toilet'), 'smart-object:::toilet:::use'] } }}>
        <NavigationObstacle id="toilet" footprint={TOILET_FOOTPRINT}><Toilet item={stub('toilet')} actionState={as} onSize={NOOP_SIZE} /></NavigationObstacle>
      </group>

      {/* Ampoule SDB (TRÅDFRI) */}
      <group
        position={[(BATH_WEST_WALL + BATH_EAST_WALL) / 2, WALL_H - 10, (BATH_NORTH_WALL + BATH_SOUTH_WALL) / 2]}
        rotation={[Math.PI, 0, 0]}
        userData={{ skipMerge: true, sceneItemRoot: true, itemName: 'Lumière Salle de bain', hoverAction: { label: name ?? 'Lumière Salle de bain', actions: getObjectActionIds('tradfri-bulb-sdb') } }}
      >
        <TradfriBulb item={stub('tradfri-bulb-sdb')} actionState={{ on: !!as['lamp-bath-toggle'], lightColor: color, brightness }} onSize={NOOP_SIZE} />
        <pointLight
          position={[0, 20, 0]}
          intensity={as['lamp-bath-toggle'] ? (lightsHD ? 120 : 2.5) * brightness : 0}
          distance={lightsHD ? 0 : 280}
          decay={lightsHD ? 1.0 : 2.0}
          color={color}
          castShadow={lightsHD}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.001}
          shadow-camera-near={1}
          shadow-camera-far={600}
        />
      </group>

      {/* VÅTHULT — bandeau LED 35 cm au-dessus du miroir vasque */}
      <group position={[BATH_EAST_WALL - 76, 176, BATH_NORTH_WALL - 2]} userData={{ sceneItemRoot: true, itemName: 'Bandeau LED Våthult' }}>
        <Vathult40467548 />
      </group>

      {/* Cabine de Douche */}
      <group
        position={[BATH_WEST_WALL + SHOWER_W / 2, 0, SHOWER_SOUTH_WALL - SHOWER_D / 2]}
        userData={{
          skipMerge: true,
          sceneItemRoot: true,
          itemName: 'Cabine de Douche',
        }}
      >
        <Shower item={stub('shower')} actionState={as} onSize={NOOP_SIZE} />
      </group>

      {/* Placard SDB */}
      <group position={[SDB_CLOSET_X, 0, SDB_CLOSET_Z]} userData={{
        sceneItemRoot: true,
        itemName: 'Placard SDB',
        hoverAction: {
          label: 'Placard SDB',
          actions: [
            ...getObjectActionIds('sdb-closet'),
            ...SMART_OBJECTS['sdb-closet'].slots.map(s => `smart-object:::sdb-closet:::${s.slotId}`),
          ],
        },
      }}>
        <NavigationObstacle id="sdb-closet"><SdbCloset item={stub('sdb-closet')} actionState={as} onSize={NOOP_SIZE} /></NavigationObstacle>
      </group>
    </MergedStaticGroup>
  );
}

// Pass 1 — Furniture (Structure & gros volumes)
export function BathroomFurniture() {
  const as = useFurnitureToggles(['cbnWest', 'cbnEast']);

  return (
    <MergedStaticGroup name="merged-bathroom-furniture">
      {/* Meubles SDB Ouest et Est */}
      <group position={BATHROOM_STORAGE_ITEMS['bathroom-cabinet-west'].position} userData={{ sceneItemRoot: true, itemName: 'Meuble SDB Ouest' }}>
        <NavigationObstacle id="bathroom-cabinet-west"><BathroomCabinetWest item={stub('bathroom-cabinet-west')} actionState={as} onSize={NOOP_SIZE} /></NavigationObstacle>
      </group>
      <group position={BATHROOM_STORAGE_ITEMS['bathroom-cabinet-east'].position} userData={{ sceneItemRoot: true, itemName: 'Meuble SDB Est' }}>
        <NavigationObstacle id="bathroom-cabinet-east"><BathroomCabinetEast item={stub('bathroom-cabinet-east')} actionState={as} onSize={NOOP_SIZE} /></NavigationObstacle>
      </group>

      {/* Poubelle Fniss SDB */}
      <group position={[110, 1, BATH_NORTH_WALL + FNISS_D / 2 + 1]} userData={{ sceneItemRoot: true, itemName: 'Poubelle Fniss SDB' }}>
        <NavigationObstacle id="fniss-bath"><Fniss40295439 /></NavigationObstacle>
      </group>
    </MergedStaticGroup>
  );
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function BathroomFurnishings() {
  return (
    <MergedStaticGroup name="merged-bathroom-furnishings">
      {/* Tapis Gazon SDB */}
      <group position={[(BATH_WEST_WALL + BATH_EAST_WALL) / 2, 0, BATH_SOUTH_WALL - 53]} userData={{ sceneItemRoot: true, itemName: 'Tapis Gazon SDB' }}>
        <GrassRug />
      </group>

      {/* Boîtes Drona sur meubles hauts SDB */}
      {Object.entries(BATHROOM_STORAGE_ITEMS).filter(([, item]) => item.kind === 'box').map(([id, item]) => (
        <group key={id} name={id} position={item.position} rotation-y={item.rotationY + Math.PI / 2} userData={{ skipMerge: true, sceneItemRoot: true, itemName: item.label, hoverAction: { label: item.label, actions: SMART_OBJECTS[id].slots.map(slot => `smart-object:::${id}:::${slot.slotId}`) } }}>
          <DroneCell />
        </group>
      ))}

      {/* TACKAN douche */}
      <group position={[BATH_WEST_WALL + 40, 80, BATH_SOUTH_WALL + 69]} userData={{ sceneItemRoot: true, itemName: 'Distributeur Tackan Douche' }}>
        <Tackan />
      </group>

      {/* TACKAN lavabo */}
      <group position={[BATH_EAST_WALL - 61, 83, BATH_NORTH_WALL + 5]} userData={{ sceneItemRoot: true, itemName: 'Distributeur Tackan Lavabo' }}>
        <Tackan />
      </group>

      {/* TISKEN sur miroir vasque */}
      <group position={[BATH_EAST_WALL - 98, 129, BATH_NORTH_WALL + 2.1]} rotation={[Math.PI / 2, 0, 0]} userData={{ sceneItemRoot: true, itemName: 'Crochet Tisken' }}>
        <Tisken40381253 />
      </group>

      {/* Rasoir OneBlade dans le panier Tisken (penché sur le rebord) */}
      <group position={[BATH_EAST_WALL - 94, 128, BATH_NORTH_WALL + 7]} rotation={[-0.4, 0.2, 1.3]} userData={{ sceneItemRoot: true, itemName: 'Rasoir OneBlade' }}>
        <OneBlade />
      </group>

      {/* Brosse à dents Oral-B dans le panier Tisken (debout/penchée au fond du bac à côté du OneBlade) */}
      <group position={[BATH_EAST_WALL - 104, 121, BATH_NORTH_WALL + 13]} rotation={[-0.15, 0.1, -0.2]} userData={{ sceneItemRoot: true, itemName: 'Brosse à dents Oral-B' }}>
        <OralBToothbrush />
      </group>

      {/* Second TISKEN sur mur douche Ouest (à 1cm du mur douche Sud, 66cm du plafond) */}
      <group position={[BATH_WEST_WALL + 2.1, WALL_H - 66, SHOWER_SOUTH_WALL - 15.3]} rotation={[Math.PI / 2, 0, -Math.PI / 2]} userData={{ sceneItemRoot: true, itemName: 'Panier Tisken Douche' }}>
        <Tisken40381253 />
      </group>

      {/* Deuxième Oral-B dans le panier Tisken douche */}
      <group position={[BATH_WEST_WALL + 13, WALL_H - 66 - 8, SHOWER_SOUTH_WALL - 15.3]} rotation={[0.1, -Math.PI / 2 + 0.15, -0.2]} userData={{ sceneItemRoot: true, itemName: 'Brosse à dents Oral-B Douche' }}>
        <OralBToothbrush />
      </group>
    </MergedStaticGroup>
  );
}
