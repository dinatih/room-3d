import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { MergedStaticGroup } from '../Building';
import { NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { ArmrestSofa } from '../items/ArmrestSofa';
import { ArmlessSofa } from '../items/ArmlessSofa';
import { Bathtub } from '../items/Bathtub';
import { ChestBench } from '../items/ChestBench';
import { PottedPalm } from '../items/PottedPalm';
import { PottedYucca } from '../items/PottedYucca';
import { BirdFeeder } from '../items/BirdFeeder';
import { Rebound } from '../items/Rebound';
import { Vatterso20562909 } from '../items/Vatterso20562909';
import { RobinBird } from '../items/RobinBird';
import { ShibaInu } from '../items/ShibaInu';
import { FemaleAnatomyBones } from '../items/FemaleAnatomyBones';
import { FemaleAnatomyMuscles } from '../items/FemaleAnatomyMuscles';
import { HumanSkeleton } from '../items/HumanSkeleton';
import { FemaleAnatomyTrio } from '../items/FemaleAnatomyTrio';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

// Pass 1 — Furniture (Structure & gros volumes)
export function GardenFurniture() {
  const as = useFurnitureToggles(['sofa-arm-left', 'sofa-arm-right']);

  return (
    <MergedStaticGroup name="merged-garden-furniture">
      {/* Canapé Jardin Est avec accoudoirs togglables */}
      <group position={[270, 0, -110]} rotation={[0, -Math.PI / 2, 0]}
             userData={{ skipMerge: true, itemName: 'Canapé Jardin Est', hoverAction: { label: 'Canapé de jardin', actions: ['sofa-arm-left', 'sofa-arm-right'] } }}>
        <ArmrestSofa item={{} as any} actionState={as} onSize={() => {}} />
      </group>

      {/* Canapé Jardin Ouest */}
      <group position={[100, 0, -80]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, skipMerge: true, itemName: 'Canapé Jardin Ouest' }}>
        <ArmlessSofa item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Banc Coffre */}
      <group position={[40, 0, -90]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, skipMerge: true, itemName: 'Banc Coffre Jardin' }}>
        <ChestBench item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Baignoire Balnéo */}
      <group position={[120, 0, -300]} rotation={[0, 1, 0]} userData={{ animUnit: true, skipMerge: true, itemName: 'Baignoire Balnéo' }}>
        <Bathtub item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Boîte de rangement Vättersö */}
      <group position={[264, 0, -320]} rotation={[0, -Math.PI / 2, 0]} userData={{ itemName: 'Boîte de Rangement Vättersö' }}>
        <Vatterso20562909 item={stub('vatterso-20562909')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function GardenFurnishings() {
  return (
    <MergedStaticGroup name="merged-garden-furnishings">
      {/* Rebounder */}
      <group position={[210, -3.48, -200]} rotation={[0, -Math.PI / 5, 0]} userData={{ animUnit: true, itemName: 'Rebound Jardin' }}>
        <Rebound item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 3 — Decor (Détails & habillage de surface)
export function GardenDecor() {
  return (
    <MergedStaticGroup name="merged-garden-decor">
      {/* Mangeoire / nid à oiseaux sous le balcon */}
      <group position={[95, 214, -165]} userData={{ animUnit: true, skipMerge: true, itemName: 'Mangeoire à Oiseaux' }}>
        <BirdFeeder item={stub('bird-feeder')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Yucca Elephantipes en pot (derrière la baignoire) */}
      <group position={[155, 0, -355]} rotation={[0, Math.PI, 0]} userData={{ animUnit: true, skipMerge: true, itemName: 'Yucca Elephantipes' }}>
        <PottedYucca item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Palmier en pot */}
      <group position={[100, 0, -145]} userData={{ animUnit: true, skipMerge: true, itemName: 'Palmier en Pot' }}>
        <PottedPalm item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Statues anatomiques (Chera - Squelette & Muscles) déplacées à gauche du trio */}
      <group position={[270, 0, -700]} userData={{ animUnit: true, skipMerge: true, itemName: 'Anatomie Féminine (Squelette)' }}>
        <FemaleAnatomyBones item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[340, 0, -700]} userData={{ animUnit: true, skipMerge: true, itemName: 'Anatomie Féminine (Muscles)' }}>
        <FemaleAnatomyMuscles item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Trio Anatomique Féminin (Corps, Squelette, Muscles) */}
      <group position={[480, 0, -700]} userData={{ animUnit: true, skipMerge: true, itemName: 'Trio Anatomique Féminin' }}>
        <FemaleAnatomyTrio item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      {/* Squelette Humain couché */}
      <group position={[600, 0, -700]} userData={{ animUnit: true, skipMerge: true, itemName: 'Squelette Humain' }}>
        <HumanSkeleton item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
    </MergedStaticGroup>
  );
}

// Animaux autonomes (Robin Bird & Shiba Inu)
export function GardenAnimals() {
  return (
    <>
      <group userData={{ animUnit: true, noAnim: true, skipMerge: true, itemName: 'Oiseau Robin', hoverAction: { label: 'Oiseau Robin', actionId: 'robin-bird-replay' } }}>
        <RobinBird />
      </group>
      <group userData={{ animUnit: true, noAnim: true, skipMerge: true, itemName: 'Shiba Inu', hoverAction: { label: 'Shiba Inu', actionId: 'shiba-replay' } }}>
        <ShibaInu />
      </group>
    </>
  );
}

export function GardenPlacements() {
  return (
    <>
      <GardenFurniture />
      <GardenFurnishings />
      <GardenDecor />
      <GardenAnimals />
    </>
  );
}
