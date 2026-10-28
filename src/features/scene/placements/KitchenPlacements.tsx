import { useEffect, useState } from 'react';
import { PositionTransition } from '../utils/PositionTransition';
import { getKitchenTrashParking, KITCHEN_TRASH_POSITION } from '../ai/diyChairClearance';
import { NavigationObstacle } from '../ai/navigation/NavigationObstacle';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { MergedStaticGroup } from '../Building';
import { NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { CuisineGroup, CuisineDrona, CuisineLillhavet } from '../items/CuisineGroup';
import { KallaxCuisine, KallaxCuisineDrona } from '../items/KallaxCuisine';
import { KALLAX_CUISINE_POSITION, KALLAX_CUISINE_ROTATION } from '../items/kallaxCuisineDrona';
import { TrashBin } from '../items/TrashBin';
import { Tackan } from '../items/Tackan';
import { Annons80298474 } from '../items/Annons80298474';
import { Middagsmat60463714 } from '../items/Middagsmat60463714';
import { Rinnig30407814 } from '../items/Rinnig30407814';
import { Lillviken20317852 } from '../items/Lillviken20317852';
import { Pepprig70567650 } from '../items/Pepprig70567650';
import { Ikea36590066708 } from '../items/Ikea36590066708';
import { Kolvatten00594176 } from '../items/Kolvatten00594176';
import { useSceneStore } from '../store/useSceneStore';
import { getObjectActionIds } from '../objectActions';
import { useLightAppearance } from '../../home-assistant/useLightAppearance';

import {
  ROOM_D,
  KITCHEN_WEST_WALL,
  KITCHEN_SOUTH_WALL,
} from '../wallData';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

const w2 = 75.5;
const KALLAX_DEPTH = 39;
const KALLAX_FRAME = 3.5;
const KALLAX_DIVIDER = 1.5;
const KALLAX_CELL_WIDTH = (w2 - 2 * KALLAX_FRAME - KALLAX_DIVIDER) / 2;
const KALLAX_UPPER_CELL_BASE = 2 * 76.5 + KALLAX_FRAME;
const IKEA365_COUNT = 3;
const IKEA365_LENGTH = 17;
const HOOD_SHELF_TOP = 166.9; // face supérieure du montant METOD couché : 173 - 7 + 0.9

export function KitchenEquipment() {
  return (
    <MergedStaticGroup name="merged-kitchen-equipment">
      {/* Meubles Cuisine (évier, structure) */}
      <group position={[KITCHEN_WEST_WALL, 0, ROOM_D]} userData={{ skipMerge: true, sceneItemRoot: true, itemName: 'Meubles Cuisine' }}>
        <NavigationObstacle id="cuisine-group"><CuisineGroup noDrona /></NavigationObstacle>
      </group>
    </MergedStaticGroup>
  );
}

// Pass 1 — Furniture (Structure & gros volumes)
export function KitchenFurniture() {
  const as = useFurnitureToggles([...getObjectActionIds('ninja-sp101')]);

  return (
    <MergedStaticGroup name="merged-kitchen-furniture">
      {/* Kallax Cuisine en séparation (structure sans Drona) */}
      <group position={KALLAX_CUISINE_POSITION} rotation={[0, KALLAX_CUISINE_ROTATION, 0]} userData={{ skipMerge: true, sceneItemRoot: true, itemName: 'Kallax Cuisine' }}>
        <NavigationObstacle id="kallax-cuisine"><KallaxCuisine item={stub('kallax-sw-stack')} actionState={as} onSize={NOOP_SIZE} noDrona /></NavigationObstacle>
      </group>

      {/* Poubelle TATAY — angle KallaxCuisine × Mackapar */}
      <KitchenTrashBin />
    </MergedStaticGroup>
  );
}

export function KitchenTrashBin() {
  const actionState = useFurnitureToggles(['bin-toggle']);
  const [parking, setParking] = useState(getKitchenTrashParking);
  useEffect(() => {
    const update = () => setParking(getKitchenTrashParking());
    document.addEventListener('kitchen-trash-clearance', update);
    return () => document.removeEventListener('kitchen-trash-clearance', update);
  }, []);
  const p = parking ?? KITCHEN_TRASH_POSITION;
  return <PositionTransition furnitureKey="trash-bin-position" x={p.x} z={p.z} ry={p.ry}>
    <group userData={{ sceneItemRoot: true, itemName: 'Poubelle Tatay' }}>
      <NavigationObstacle id="trash-bin"><TrashBin item={stub('trash-bin')} actionState={actionState} onSize={NOOP_SIZE} /></NavigationObstacle>
    </group>
  </PositionTransition>;
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function KitchenFurnishings() {
  const as = useFurnitureToggles(['lamp-kitchen-toggle']);
  const lightsHD = useSceneStore(state => state.layers.lightsHD);
  const { name, color, brightness } = useLightAppearance('lampKitchen', 0xfff5e6);
  const isKitchenLampOn = Boolean(as['lamp-kitchen-toggle']);

  return (
    <MergedStaticGroup name="merged-kitchen-furnishings">
      {/* Boîtes Drona intégrées à la cuisine */}
      <group position={[KITCHEN_WEST_WALL, 0, ROOM_D]} userData={{ sceneItemRoot: true, itemName: 'Boîtes Drona Cuisine' }}>
        <CuisineDrona />
      </group>

      {/* Boîtes Drona intégrées au Kallax Cuisine */}
      <group position={KALLAX_CUISINE_POSITION} rotation={[0, KALLAX_CUISINE_ROTATION, 0]}>
        <KallaxCuisineDrona />
      </group>

      {/* IKEA 365+ — bord avant de la case supérieure gauche (côté nord). */}
      <group position={KALLAX_CUISINE_POSITION} rotation={[0, KALLAX_CUISINE_ROTATION, 0]}>
        {Array.from({ length: IKEA365_COUNT }, (_, i) => (
          <group key={i}
            position={[-w2 / 2 + KALLAX_FRAME + (i + 0.5) * KALLAX_CELL_WIDTH / IKEA365_COUNT, KALLAX_UPPER_CELL_BASE, (KALLAX_DEPTH - IKEA365_LENGTH) / 2]}
            rotation-y={Math.PI / 2}
            userData={{ sceneItemRoot: true, itemName: 'Boîte IKEA 365+' }}>
            <Ikea36590066708 />
          </group>
        ))}
      </group>

      {/* LILLHAVET — égouttoir dans le meuble haut cuisine */}
      <group position={[KITCHEN_WEST_WALL, 0, ROOM_D]} userData={{ sceneItemRoot: true, itemName: 'Égouttoir Lillhavet' }}>
        <CuisineLillhavet />
      </group>

      {/* TACKAN évier — plan cuisine (y=93), fond à droite de la niche */}
      <group position={[KITCHEN_WEST_WALL + 5, 93, KITCHEN_SOUTH_WALL - 5]} userData={{ sceneItemRoot: true, itemName: 'Distributeur Tackan Cuisine' }}>
        <Tackan />
      </group>

      {/* Casseroles sur la tablette existante du meuble METOD couché. */}
      <group position={[KITCHEN_WEST_WALL + 50, HOOD_SHELF_TOP, ROOM_D + 41.5]} rotation-y={-Math.PI / 2} userData={{ sceneItemRoot: true, itemName: 'Casserole MIDDAGSMAT' }}>
        <Middagsmat60463714 />
      </group>
      <group position={[KITCHEN_WEST_WALL + 86.5, HOOD_SHELF_TOP, ROOM_D + 41.5]} rotation-y={Math.PI / 2} userData={{ sceneItemRoot: true, itemName: 'Faitout ANNONS' }}>
        <Annons80298474 />
      </group>
      <group position={[KITCHEN_WEST_WALL + 14, 93, KITCHEN_SOUTH_WALL - 5]} userData={{ sceneItemRoot: true, itemName: 'Brosse RINNIG' }}>
        <Rinnig30407814 />
      </group>
      {/* BOHOLMEN : fond de cuve et centre de bonde à [20, 78, 26] dans la cuisine. */}
      <group position={[KITCHEN_WEST_WALL + 20, 78, ROOM_D + 26]} userData={{ sceneItemRoot: true, itemName: 'Bouchon LILLVIKEN' }}>
        <Lillviken20317852 />
      </group>

      {/* PEPPRIG : deux éponges verticales contre la paroi intérieure côté robinet. */}
      {[14, 26].map(x => (
        <group key={x} position={[KITCHEN_WEST_WALL + x, 86, ROOM_D + 45.5]} rotation={[-Math.PI / 2 + Math.atan(0.055), 0, 0]} userData={{ sceneItemRoot: true, itemName: 'Éponge PEPPRIG rouge foncé' }}>
          <Pepprig70567650 />
        </group>
      ))}

      {/* KÖLVATTEN éclairage LED avec capteur — angle bas meuble haut METOD / mur ouest */}
      <group
        position={[KITCHEN_WEST_WALL + 1.8, 153, ROOM_D + 41.5]}
        rotation={[Math.PI, Math.PI / 2, 0]}
        userData={{
          skipMerge: true,
          sceneItemRoot: true,
          itemName: 'KÖLVATTEN éclairage LED avec capteur',
          hoverAction: { label: name ?? 'Barre · Cuisine', actions: getObjectActionIds('kolvatten00594176') },
        }}
      >
        <Kolvatten00594176 item={stub('kolvatten00594176')} actionState={{ on: isKitchenLampOn, lightColor: color, brightness }} onSize={NOOP_SIZE} />
        <pointLight
          position={[0, 5, 0]}
          intensity={isKitchenLampOn ? (lightsHD ? 80 : 2.5) * brightness : 0}
          distance={lightsHD ? 0 : 200}
          decay={lightsHD ? 1.0 : 2.0}
          color={color}
          castShadow={lightsHD}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.001}
          shadow-camera-near={1}
          shadow-camera-far={400}
        />
      </group>
    </MergedStaticGroup>
  );
}
