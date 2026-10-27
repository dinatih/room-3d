import { NavigationObstacle } from '../ai/navigation/NavigationObstacle';
import { getObjectActionIds } from '../objectActions';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { MergedStaticGroup } from '../Building';
import { NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';

import { ArmrestSofa } from '../items/ArmrestSofa';
import { ArmlessSofa } from '../items/ArmlessSofa';
import { Bathtub } from '../items/Bathtub';
import { BATHTUB } from '../bathtubData';
import { ChestBench } from '../items/ChestBench';
import { PottedPalm } from '../items/PottedPalm';
import { PottedYucca } from '../items/PottedYucca';
import { BirdFeeder } from '../items/BirdFeeder';
import { Vatterso20562909 } from '../items/Vatterso20562909';
import { BathtubStarfish } from '../items/Starfish';
import { Goldfish } from '../items/Goldfish';
import { RobinBird } from '../items/RobinBird';
import { BlackHornetDrone } from '../items/BlackHornetDrone';
import { DogBowl } from '../items/DogBowl';
import { ULOTTE_BOWL_POSITION } from '../items/dogBowlData';
import { Dachshund } from '../items/Dachshund';
import { ShibaInu } from '../items/ShibaInu';
import { FemaleAnatomyBones } from '../items/FemaleAnatomyBones';
import { FemaleAnatomyMuscles } from '../items/FemaleAnatomyMuscles';
import { HumanSkeleton } from '../items/HumanSkeleton';
import { FemaleAnatomyTrio } from '../items/FemaleAnatomyTrio';
import { BeachBall } from '../items/BeachBall';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

// Pass 1 — Furniture (Structure & gros volumes)
export function GardenFurniture() {
  const as = useFurnitureToggles(['sofa-arm-left', 'sofa-arm-right', ...getObjectActionIds('chest-bench')]);

  return (
    <MergedStaticGroup name="merged-garden-furniture">
      {/* Canapé Jardin Est avec accoudoirs togglables */}
      <group position={[270, 0, -110]} rotation={[0, -Math.PI / 2, 0]}
             userData={{ skipMerge: true, birdSupport: { id: 'sofa-east', kind: 'furniture' }, itemName: 'Canapé Jardin Est', hoverAction: { label: 'Canapé Jardin Est', actions: [...getObjectActionIds('armrest-sofa'), ...SMART_OBJECTS['sofa-garden-east'].slots.map(slot => `smart-object:::sofa-garden-east:::${slot.slotId}`)] } }}>
        <NavigationObstacle id="sofa-garden-east"><ArmrestSofa item={{} as any} actionState={as} onSize={() => {}} /></NavigationObstacle>
      </group>

      {/* Canapé Jardin Ouest */}
      <group position={[100, 0, -80]} rotation={[0, Math.PI / 2, 0]} userData={{ sceneItemRoot: true, skipMerge: true, birdSupport: { id: 'sofa-west', kind: 'furniture' }, itemName: 'Canapé Jardin Ouest', hoverAction: { label: 'Canapé Jardin Ouest', actions: SMART_OBJECTS['sofa-garden-west'].slots.map(slot => `smart-object:::sofa-garden-west:::${slot.slotId}`) } }}>
        <NavigationObstacle id="sofa-garden-west"><ArmlessSofa /></NavigationObstacle>
      </group>

      {/* Banc Coffre */}
      <group position={[40, 0, -90]} rotation={[0, Math.PI / 2, 0]} userData={{ sceneItemRoot: true, skipMerge: true, birdSupport: { id: 'chest', kind: 'furniture' }, itemName: 'Banc Coffre Jardin' }}>
        <NavigationObstacle id="chest-bench"><ChestBench item={stub('chest-bench')} actionState={as} onSize={NOOP_SIZE} /></NavigationObstacle>
      </group>

      {/* Baignoire Balnéo */}
      <group position={BATHTUB.position} rotation={BATHTUB.rotation} userData={{ sceneItemRoot: true, skipMerge: true, birdSupport: { id: 'bathtub', kind: 'furniture' }, itemName: 'Baignoire Balnéo', hoverAction: { label: 'Baignoire Balnéo', actions: SMART_OBJECTS['bathtub-garden'].slots.map(slot => `smart-object:::bathtub-garden:::${slot.slotId}`) } }}>
        <NavigationObstacle id="bathtub-garden"><Bathtub /></NavigationObstacle>
        {/* Ballon de plage flottant sur l'eau de la baignoire avec physique */}
        <BeachBall item={stub('beach-ball')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Boîte de rangement Vättersö */}
      <group position={[264, 0, -320]} rotation={[0, -Math.PI / 2, 0]} userData={{ skipMerge: true, sceneItemRoot: true, birdSupport: { id: 'storage', kind: 'lid' }, itemName: 'Boîte de Rangement Vättersö' }}>
        <NavigationObstacle id="garden-storage"><Vatterso20562909 /></NavigationObstacle>
      </group>
    </MergedStaticGroup>
  );
}


// Pass 3 — Decor (Détails & habillage de surface)
export function GardenDecor() {
  return (
    <MergedStaticGroup name="merged-garden-decor">
      <group position={ULOTTE_BOWL_POSITION} userData={{ skipMerge: true, itemName: 'Gamelle d’Ulotte — jardin voisin Est' }}>
        <NavigationObstacle id="ulotte-bowl"><DogBowl item={stub('ulotte-bowl')} actionState={NOOP_STATE} onSize={NOOP_SIZE} feedingStation /></NavigationObstacle>
      </group>
      {/* Mangeoire / nid à oiseaux sous le balcon */}
      <group position={[95, 214, -165]} userData={{ sceneItemRoot: true, skipMerge: true, birdSupport: { id: 'feeder', kind: 'feeder' }, itemName: 'Mangeoire à Oiseaux' }}>
        <BirdFeeder />
      </group>

      {/* Yucca Elephantipes en pot (derrière la baignoire) */}
      <group position={[155, 0, -355]} rotation={[0, Math.PI, 0]} userData={{ sceneItemRoot: true, skipMerge: true, birdSupport: { id: 'yucca', kind: 'plant' }, itemName: 'Yucca Elephantipes' }}>
        <NavigationObstacle id="yucca"><PottedYucca /></NavigationObstacle>
      </group>

      {/* Palmier en pot */}
      <group position={[100, 0, -145]} userData={{ sceneItemRoot: true, skipMerge: true, birdSupport: { id: 'palm', kind: 'plant' }, itemName: 'Palmier en Pot' }}>
        <NavigationObstacle id="palm" solidOnly><PottedPalm /></NavigationObstacle>
      </group>

      {/* Statues anatomiques (Chera - Squelette & Muscles) déplacées à gauche du trio */}
      <group position={[270, 0, -700]} userData={{ sceneItemRoot: true, skipMerge: true, itemName: 'Anatomie Féminine (Squelette)' }}>
        <NavigationObstacle id="statue-bones"><FemaleAnatomyBones /></NavigationObstacle>
      </group>
      <group position={[340, 0, -700]} userData={{ sceneItemRoot: true, skipMerge: true, itemName: 'Anatomie Féminine (Muscles)' }}>
        <NavigationObstacle id="statue-muscles"><FemaleAnatomyMuscles /></NavigationObstacle>
      </group>

      {/* Trio Anatomique Féminin (Corps, Squelette, Muscles) */}
      <group position={[480, 0, -700]} userData={{ sceneItemRoot: true, skipMerge: true, itemName: 'Trio Anatomique Féminin' }}>
        <NavigationObstacle id="statue-trio"><FemaleAnatomyTrio /></NavigationObstacle>
      </group>

      {/* Squelette Humain couché */}
      <group position={[600, 0, -700]} userData={{ sceneItemRoot: true, skipMerge: true, itemName: 'Squelette Humain' }}>
        <NavigationObstacle id="statue-skeleton"><HumanSkeleton /></NavigationObstacle>
      </group>
    </MergedStaticGroup>
  );
}

// Animaux autonomes (Robin Bird & Shiba Inu)
export function GardenAnimals() {
  return (
    <>
      <group position={BATHTUB.position} rotation={BATHTUB.rotation}
             userData={{ sceneItemRoot: true, dynamicActor: true, skipMerge: true, itemName: 'Poisson rouge Jikin' }}>
        <Goldfish />
      </group>
      <group position={BATHTUB.position} rotation={BATHTUB.rotation}>
        <Goldfish species="tosakin" />
        <BathtubStarfish />
      </group>
      <group userData={{ sceneItemRoot: true, dynamicActor: true, skipMerge: true, itemName: 'Oiseau Robin', hoverAction: { label: 'Oiseau Robin', actions: ['robin-bird-replay', 'animal-robin-fpv', 'animal-robin-follow'] } }}>
        <RobinBird />
      </group>
      <group userData={{ sceneItemRoot: true, dynamicActor: true, skipMerge: true, itemName: 'Drone Black Hornet Nano', hoverAction: { label: 'Black Hornet Nano Drone', actions: getObjectActionIds('black-hornet-drone') } }}>
        <BlackHornetDrone />
      </group>
      <group userData={{ sceneItemRoot: true, dynamicActor: true, skipMerge: true, itemName: 'Shiba Inu' }}>
        <ShibaInu />
      </group>
      <group position={[210, 0, -200]} rotation={[0, -Math.PI / 4, 0]} userData={{ sceneItemRoot: true, dynamicActor: true, skipMerge: true, itemName: 'Ulotte (Teckel)' }}>
        <Dachshund />
      </group>
    </>
  );
}
