import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PointLight } from 'three';
import { OccupancyManager } from '../ai/occupancyManager';
import { cameraState } from '../cameraState';
import { NavigationObstacle } from '../ai/navigation/NavigationObstacle';
import { getObjectActionIds } from '../objectActions';
import { useLightAppearance } from '../../home-assistant/useLightAppearance';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from '../Building';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';

import { WaterHeater, WH_W, WH_D, WH_H } from '../items/WaterHeater';
import { Toilet, TOILET_W, TOILET_D } from '../items/Toilet';
import { Shower, SHOWER_W, SHOWER_D } from '../items/Shower';
import { Havback49514017, HAVBACK_D } from '../items/Havback49514017';
import { BathroomCabinetWest, BathroomCabinetEast } from '../items/BathroomCabinet';
import { SdbCloset, SDB_CLOSET_X, SDB_CLOSET_Z, SDB_CLOSET_W, SDB_CLOSET_D, SDB_CLOSET_SHELF_TOP } from '../items/SdbCloset';
import { TradfriBulb } from '../items/TradfriBulb';
import { Vathult40467548 } from '../items/Vathult40467548';
import { GrassRug } from '../items/GrassRug';
import { Tackan } from '../items/Tackan';
import { Tisken40381253 } from '../items/Tisken40381253';
import { OneBlade } from '../items/OneBlade';
import { OralBToothbrush } from '../items/OralBToothbrush';
import { Fniss40295439, FNISS_D } from '../items/Fniss40295439';
import { DroneCell, DF } from '../items/Drona';
import { Stackstod60620144 } from '../items/Stackstod60620144';
import { Wy0083, WY0083_HEIGHT } from '../items/Wy0083';
import { TowelFoldedRed, TowelHangingLargeRed, TowelHangingSmallRed } from '../items/TowelSetRed';
import { BATHROOM_STORAGE_ITEMS } from '../items/bathroomStorage';
import { TemuRollingBin, TEMU_ROLLING_BIN_DEPTH } from '../items/TemuRollingBin';
import { CecotecReadywarm } from '../items/CecotecReadywarm';
import { CifInfiniteClean, W5Bleach, Plogsvaeng, LaundryDetergent, FabricSoftener, LAUNDRY_DETERGENT_SIZE, FABRIC_SOFTENER_SIZE } from '../items/CleaningProducts';
import { CreamPump, AxeDeodorant } from '../items/CosmeticProducts';
import { KabbaLaundryBag, KABBA_HANDLE_HEIGHT } from '../items/KabbaLaundryBag';
import { SdbLaundryHook, LAUNDRY_HOOK_HEIGHT, LAUNDRY_HOOK_GRIP_HEIGHT } from '../items/SdbLaundryHook';
import { ViledaSprayOne, VILEDA_SPRAY_ONE_SIZE } from '../items/ViledaSprayOne';
import { ToiletPaperRoll, PaperTowelRoll, TOILET_PAPER_DIAMETER, PAPER_TOWEL_DIAMETER } from '../items/PaperRolls';

import { WALL_H, BATH_SOUTH_WALL, BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL, SHOWER_SOUTH_WALL, DiagWall } from '../wallData';

const TOWEL_RACK_BASE_Y = 111;
const TOWEL_RACK_Z = BATH_NORTH_WALL + 64 + 20.1;
const HEATER_ABOVE_RACK_GAP = 22;
const HEATER_DEPTH = 18;
// Viewed from the bathroom, the right-hand closet panel is the -X side.
const CLOSET_RIGHT_EDGE_X = SDB_CLOSET_X - SDB_CLOSET_W / 2;
const CLOSET_SHELF_FRONT_Z = SDB_CLOSET_Z + SDB_CLOSET_D / 2;
const PRODUCT_EDGE_GAP = 1;
const VILEDA_PARKING_Z = CLOSET_SHELF_FRONT_Z + PRODUCT_EDGE_GAP + VILEDA_SPRAY_ONE_SIZE.depth / 2;
// The whole 40 cm pad must clear the diagonal, including its far rear corner.
const VILEDA_PARKING_X = DiagWall.A.x + (
  VILEDA_PARKING_Z + VILEDA_SPRAY_ONE_SIZE.depth / 2
  + PRODUCT_EDGE_GAP * Math.sqrt(1 + DiagWall.slope ** 2) - DiagWall.A.z
) / DiagWall.slope - VILEDA_SPRAY_ONE_SIZE.width / 2;
// Right from the bathroom is the shower side; keep the existing bag shape.
const LAUNDRY_HOOK_X = CLOSET_RIGHT_EDGE_X + 38;
const LAUNDRY_HOOK_Z = CLOSET_SHELF_FRONT_Z + 30;
const LAUNDRY_HOOK_BASE_Y = SDB_CLOSET_SHELF_TOP - 2 - LAUNDRY_HOOK_HEIGHT;
// Align the bag's broad faces with the diagonal wall so it fits below the shelf.
const LAUNDRY_BAG_ROTATION_Y = Math.PI + Math.atan(-DiagWall.slope);

// Retrait de 5 cm sur chaque bord pour dégager l'accès aux meubles et boîtes DRÖNA.
const TOILET_OBSTACLE_INSET = 5;
const TOILET_FOOTPRINT = [
  { x: -TOILET_W / 2 + TOILET_OBSTACLE_INSET, z: -TOILET_D / 2 + TOILET_OBSTACLE_INSET },
  { x: TOILET_W / 2 - TOILET_OBSTACLE_INSET, z: -TOILET_D / 2 + TOILET_OBSTACLE_INSET },
  { x: TOILET_W / 2 - TOILET_OBSTACLE_INSET, z: TOILET_D / 2 - TOILET_OBSTACLE_INSET },
  { x: -TOILET_W / 2 + TOILET_OBSTACLE_INSET, z: TOILET_D / 2 - TOILET_OBSTACLE_INSET },
];

function SinkLight() {
  const light = useRef<PointLight>(null!);
  const lightsHD = useSceneStore(state => state.layers.lightsHD);
  const on = useSceneStore(state => !!state.furniture.lampSink);
  useEffect(() => {
    if (light.current) light.current.intensity = on ? 6 * 100 ** 2 : 0;
  }, [on]);
  useFrame(() => {
    const inUse = OccupancyManager.getReservations().some(({ slot, characterId }) => {
      if (!slot.startsWith('vasque-sdb:')) return false;
      const action = SMART_OBJECTS['vasque-sdb'].slots.find(candidate => candidate.slotId === slot.split(':')[1]);
      return !!action?.animation && action.animation === cameraState.positions[characterId]?.anim;
    });
    light.current.intensity = (on || inUse) ? 6 * 100 ** 2 : 0;
  });
  return <group position={[BATH_EAST_WALL - 76, 176, BATH_NORTH_WALL - 2]} userData={{ skipMerge: true, sceneItemRoot: true, itemName: 'Bandeau LED Våthult', hoverAction: { label: 'Lumière Lavabo', actions: ['lamp-sink-toggle'] } }}>
    <Vathult40467548 />
    <pointLight ref={light} position={[0, -3, 8]} color="#fff2dc" intensity={on ? 6 * 100 ** 2 : 0} distance={140} decay={2} castShadow={lightsHD} shadow-mapSize={[512, 512]} shadow-camera-near={1} shadow-camera-far={180} />
  </group>;
}

export function BathroomEquipment() {
  const { name, color, brightness } = useLightAppearance('lampBath', 0xffc266);
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

      {/* Cecotec : bas du chauffage à 22 cm au-dessus du sommet du porte-serviettes. */}
      <group position={[BATH_WEST_WALL + HEATER_DEPTH / 2, TOWEL_RACK_BASE_Y + WY0083_HEIGHT + HEATER_ABOVE_RACK_GAP, TOWEL_RACK_Z]} rotation-y={Math.PI / 2} userData={{ sceneItemRoot: true, itemName: 'Chauffage Cecotec ReadyWarm' }}>
        <CecotecReadywarm />
      </group>

      {/* Meuble Vasque SDB */}
      <group position={[BATH_EAST_WALL - 76, 14, BATH_NORTH_WALL + HAVBACK_D / 2]} userData={{ sceneItemRoot: true, itemName: 'Meuble Vasque SDB', hoverAction: { label: 'Lavabo Salle de bain', actions: SMART_OBJECTS['vasque-sdb'].slots.map(slot => `smart-object:::vasque-sdb:::${slot.slotId}`) } }}>
        <NavigationObstacle id="vasque-sdb"><Havback49514017 /></NavigationObstacle>
      </group>

      {/* WC President */}
      <group position={[BATH_WEST_WALL + 60, 1, BATH_NORTH_WALL + TOILET_D / 2 + 1.5]} userData={{ skipMerge: true, sceneItemRoot: true, itemName: 'WC President', hoverAction: { label: 'WC President', actions: [...getObjectActionIds('toilet'), 'smart-object:::toilet:::use'] } }}>
        <NavigationObstacle id="toilet" footprint={TOILET_FOOTPRINT}><Toilet actionState={as} /></NavigationObstacle>
      </group>

      {/* Ampoule SDB (TRÅDFRI) */}
      <group
        position={[(BATH_WEST_WALL + BATH_EAST_WALL) / 2, WALL_H - 10, (BATH_NORTH_WALL + BATH_SOUTH_WALL) / 2]}
        rotation={[Math.PI, 0, 0]}
        userData={{ skipMerge: true, sceneItemRoot: true, itemName: 'Lumière Salle de bain', hoverAction: { label: name ?? 'Lumière Salle de bain', actions: getObjectActionIds('tradfri-bulb-sdb') } }}
      >
        <TradfriBulb actionState={{ on: !!as['lamp-bath-toggle'], lightColor: color, brightness }} />
        <pointLight
          position={[0, 20, 0]}
          intensity={as['lamp-bath-toggle'] ? 20 * 100 ** 2 * brightness : 0}
          distance={0}
          decay={2}
          color={color}
          castShadow={lightsHD}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.001}
          shadow-camera-near={1}
          shadow-camera-far={600}
        />
      </group>

      {/* VÅTHULT — bandeau LED 35 cm au-dessus du miroir vasque */}
      <SinkLight />

      {/* Cabine de Douche */}
      <group
        position={[BATH_WEST_WALL + SHOWER_W / 2, 0, SHOWER_SOUTH_WALL - SHOWER_D / 2]}
        userData={{
          skipMerge: true,
          sceneItemRoot: true,
          itemName: 'Cabine de Douche',
        }}
      >
        <Shower actionState={as} />
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
        <NavigationObstacle id="sdb-closet"><SdbCloset actionState={as} /></NavigationObstacle>
      </group>
    </MergedStaticGroup>
  );
}

// Pass 1 — Furniture (Structure & gros volumes)
export function BathroomFurniture() {
  const as = useFurnitureToggles(['cbnWest', 'cbnEast']);
  const westCabinet = BATHROOM_STORAGE_ITEMS['bathroom-cabinet-west'].position;
  // 37 cm carcass + half the 1.7 cm door thickness; leave 1 cm to the closed door.
  const westCabinetFront = westCabinet[2] + 37 / 2 + 1.7 / 2;

  return (
    <MergedStaticGroup name="merged-bathroom-furniture">
      {/* Meubles SDB Ouest et Est */}
      <group position={BATHROOM_STORAGE_ITEMS['bathroom-cabinet-west'].position} userData={{ sceneItemRoot: true, itemName: 'Meuble SDB Ouest' }}>
        <NavigationObstacle id="bathroom-cabinet-west"><BathroomCabinetWest actionState={as} /></NavigationObstacle>
      </group>
      <group position={BATHROOM_STORAGE_ITEMS['bathroom-cabinet-east'].position} userData={{ sceneItemRoot: true, itemName: 'Meuble SDB Est' }}>
        <NavigationObstacle id="bathroom-cabinet-east"><BathroomCabinetEast actionState={as} /></NavigationObstacle>
      </group>

      {/* Poubelle rouge sur roulettes, centrée devant la porte du METOD ouest. */}
      <group position={[westCabinet[0], 0, westCabinetFront + 1 + TEMU_ROLLING_BIN_DEPTH / 2]} userData={{ sceneItemRoot: true, itemName: 'Poubelle rouge sur roulettes' }}>
        <NavigationObstacle id="temu-rolling-bin"><TemuRollingBin /></NavigationObstacle>
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
          <group position={[0.26, -DF / 2 + 15, id === 'drona-bathroom-west' ? 9.765 : -9.765]} userData={{ sceneItemRoot: true, itemName: `STACKSTOD ${item.label}` }}>
            <Stackstod60620144 />
            {id === 'drona-bathroom-east' && <>
              <group position={[-8, 1, 0]} userData={{ sceneItemRoot: true, itemName: 'Déodorant en spray (Axe)' }}><AxeDeodorant /></group>
              <group position={[8, 1, 0]} userData={{ sceneItemRoot: true, itemName: 'Crème en distributeur' }}><CreamPump /></group>
            </>}
          </group>
          {id === 'drona-bathroom-west' && <group position={[0, -DF / 2 + 1, -9]} userData={{ sceneItemRoot: true, itemName: 'Cif Infinite+Clean SDB Ouest' }}><CifInfiniteClean /></group>}
          {id === 'drona-bathroom-west' && <>
            <group position={[-9, -DF / 2 + 1, -9]} userData={{ sceneItemRoot: true, itemName: 'Papier WC DRÖNA SDB Ouest' }}><ToiletPaperRoll /></group>
            <group position={[9, -DF / 2 + 1, -9]} userData={{ sceneItemRoot: true, itemName: 'Essuie-tout DRÖNA SDB Ouest' }}><PaperTowelRoll /></group>
          </>}
        </group>
      ))}

      {/* Couvercle du réservoir mesuré dans le GLB : 83,82 cm, WC posé à Y=1.
          Rouleau à gauche du bouton, sans recouvrir la commande de chasse. */}
      <group position={[BATH_WEST_WALL + 60 - 10, 1 + 83.82, BATH_NORTH_WALL + TOILET_D / 2 + 1.5 - 25.8]} userData={{ sceneItemRoot: true, itemName: 'Papier WC sur réservoir' }}>
        <ToiletPaperRoll />
      </group>

      {/* Six WC (3 × 2) et quatre essuie-tout (2 × 2), sur la tablette
          triangulaire : les rangées reculent du mur diagonal côté étroit. */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`closet-wc-${i}`} position={[CLOSET_RIGHT_EDGE_X + 12 + (i % 3) * (TOILET_PAPER_DIAMETER + PRODUCT_EDGE_GAP), SDB_CLOSET_SHELF_TOP, CLOSET_SHELF_FRONT_Z + 30 + Math.floor(i / 3) * (TOILET_PAPER_DIAMETER + PRODUCT_EDGE_GAP)]} userData={{ sceneItemRoot: true, itemName: `Papier WC placard SDB ${i + 1}` }}>
          <ToiletPaperRoll />
        </group>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={`closet-towel-${i}`} position={[CLOSET_RIGHT_EDGE_X + 51 + (i % 2) * (PAPER_TOWEL_DIAMETER + PRODUCT_EDGE_GAP), SDB_CLOSET_SHELF_TOP, CLOSET_SHELF_FRONT_Z + 11 + Math.floor(i / 2) * (PAPER_TOWEL_DIAMETER + PRODUCT_EDGE_GAP)]} userData={{ sceneItemRoot: true, itemName: `Essuie-tout placard SDB ${i + 1}` }}>
          <PaperTowelRoll />
        </group>
      ))}

      {/* Spray transparent au sol, au milieu du passage entre le WC et le meuble vasque. */}
      <group position={[(BATH_WEST_WALL + 60 + TOILET_W / 2 + BATH_EAST_WALL - 76 - 62 / 2) / 2, 0, BATH_NORTH_WALL + HAVBACK_D / 2]} userData={{ sceneItemRoot: true, itemName: 'Spray nettoyant transparent SDB' }}>
        <NavigationObstacle id="spray-cleaner-bath"><W5Bleach /></NavigationObstacle>
      </group>

      {/* GREJIG côté droit du placard : gauche vue depuis la SDB = +X.
          Support à 17 cm ; rangement de 20 × 15 cm au fond gauche. */}
      <group position={[SDB_CLOSET_X - SDB_CLOSET_W / 4, 17, SDB_CLOSET_Z + 20]}>
        <group position={[17, 0, 5]} userData={{ sceneItemRoot: true, itemName: 'PLOGSVÄNG placard SDB' }}><Plogsvaeng /></group>
        <group position={[1, 0, 3]} rotation-y={Math.PI} userData={{ sceneItemRoot: true, itemName: 'Cif Infinite+Clean placard SDB' }}><CifInfiniteClean /></group>
        <group position={[-18, 0, 3]} rotation-y={Math.PI} userData={{ sceneItemRoot: true, itemName: 'Javel W5 placard SDB' }}><W5Bleach /></group>
      </group>

      {/* Un seul crochet sous l'étagère, à droite côté douche. */}
      <group position={[LAUNDRY_HOOK_X, LAUNDRY_HOOK_BASE_Y, LAUNDRY_HOOK_Z]}
        rotation-y={LAUNDRY_BAG_ROTATION_Y} userData={{ sceneItemRoot: true, itemName: 'Crochet du sac à linge SDB' }}>
        <SdbLaundryHook />
        <group position={[0, LAUNDRY_HOOK_GRIP_HEIGHT - KABBA_HANDLE_HEIGHT, 0]}
          userData={{ sceneItemRoot: true, itemName: 'Sac KABBA rouge — linge sale' }}>
          <KabbaLaundryBag />
        </group>
      </group>

      {/* Lessive et adoucissant sur la tablette, au bord avant droit depuis la SDB. */}
      {/* Gauche depuis la SDB = +X : au sol derrière le rail, sous la tablette. */}
      <group position={[VILEDA_PARKING_X, 0, VILEDA_PARKING_Z]} rotation-y={Math.PI} userData={{ sceneItemRoot: true, itemName: 'Balai Vileda 1-2-Spray ONE' }}>
        <ViledaSprayOne />
      </group>

      <group position={[CLOSET_RIGHT_EDGE_X + PRODUCT_EDGE_GAP + LAUNDRY_DETERGENT_SIZE.width / 2, SDB_CLOSET_SHELF_TOP, CLOSET_SHELF_FRONT_Z + PRODUCT_EDGE_GAP + LAUNDRY_DETERGENT_SIZE.depth / 2]} rotation-y={Math.PI} userData={{ sceneItemRoot: true, itemName: 'Lessive placard SDB' }}>
        <LaundryDetergent />
      </group>
      <group position={[CLOSET_RIGHT_EDGE_X + PRODUCT_EDGE_GAP + LAUNDRY_DETERGENT_SIZE.width + PRODUCT_EDGE_GAP + FABRIC_SOFTENER_SIZE.width / 2, SDB_CLOSET_SHELF_TOP, CLOSET_SHELF_FRONT_Z + PRODUCT_EDGE_GAP + FABRIC_SOFTENER_SIZE.depth / 2]} rotation-y={Math.PI} userData={{ sceneItemRoot: true, itemName: 'Adoucissant placard SDB' }}>
        <FabricSoftener />
      </group>

      {/* Porte-serviettes WY008-3 sur le mur Ouest SDB (à 111 cm du sol, 64 cm du mur Nord) */}
      <group position={[BATH_WEST_WALL + 11, TOWEL_RACK_BASE_Y, TOWEL_RACK_Z]} rotation-y={-Math.PI / 2} userData={{ sceneItemRoot: true, itemName: 'Porte-serviettes WY008-3' }}>
        <Wy0083 />
        {/* Grande serviette pliée sur l'étage haut */}
        <group position={[0, 21.6, -0.7]} userData={{ sceneItemRoot: true, itemName: 'Grande serviette rouge pliée' }}>
          <TowelFoldedRed />
        </group>
        {/* 2 petites serviettes sur les 2 crochets les plus au nord */}
        <group position={[-18.9, 2.4, 8.1]} userData={{ sceneItemRoot: true, itemName: 'Petite serviette rouge (crochet nord 1)' }}>
          <TowelHangingSmallRed />
        </group>
        <group position={[-13.0, 2.4, 7.4]} userData={{ sceneItemRoot: true, itemName: 'Petite serviette rouge (crochet nord 2)' }}>
          <TowelHangingSmallRed />
        </group>
        {/* Grande serviette suspendue à un crochet */}
        <group position={[13.0, 2.4, 7.4]} userData={{ sceneItemRoot: true, itemName: 'Grande serviette rouge suspendue' }}>
          <TowelHangingLargeRed />
        </group>
      </group>

      {/* TACKAN douche */}
      <group position={[BATH_WEST_WALL + 40, 92.5, SHOWER_SOUTH_WALL - 5.6]} userData={{ sceneItemRoot: true, itemName: 'Distributeur Tackan Douche' }}>
        <Tackan fillLevel={2 / 3} soapColor="#8334b7" />
      </group>

      {/* TACKAN lavabo */}
      <group position={[BATH_EAST_WALL - 61, 83, BATH_NORTH_WALL + 5]} userData={{ sceneItemRoot: true, itemName: 'Distributeur Tackan Lavabo' }}>
        <Tackan fillLevel={1 / 3} />
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

      {/* Second TISKEN sur mur douche Est (à 1cm du mur douche Sud, 66cm du plafond) */}
      <group position={[BATH_WEST_WALL + SHOWER_W - 2.1, WALL_H - 66, SHOWER_SOUTH_WALL - 15.3]} rotation={[Math.PI / 2, 0, Math.PI / 2]} userData={{ sceneItemRoot: true, itemName: 'Panier Tisken Douche' }}>
        <Tisken40381253 />
      </group>

      {/* Deuxième Oral-B dans le panier Tisken douche */}
      <group position={[BATH_WEST_WALL + SHOWER_W - 13, WALL_H - 66 - 8, SHOWER_SOUTH_WALL - 15.3]} rotation={[0.1, Math.PI / 2 - 0.15, -0.2]} userData={{ sceneItemRoot: true, itemName: 'Brosse à dents Oral-B Douche' }}>
        <OralBToothbrush />
      </group>
    </MergedStaticGroup>
  );
}
