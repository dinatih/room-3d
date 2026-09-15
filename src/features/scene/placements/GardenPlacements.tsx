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

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

export function GardenPlacements() {
  const as = useFurnitureToggles(['sofa-arm-left', 'sofa-arm-right']);

  return (
    <>
      <MergedStaticGroup name="merged-garden">
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

        {/* Yucca Elephantipes en pot (derrière la baignoire) */}
        <group position={[155, 0, -355]} rotation={[0, Math.PI, 0]} userData={{ animUnit: true, skipMerge: true, itemName: 'Yucca Elephantipes' }}>
          <PottedYucca item={{} as any} actionState={{}} onSize={() => {}} />
        </group>

        {/* Palmier en pot */}
        <group position={[100, 0, -145]} userData={{ animUnit: true, skipMerge: true, itemName: 'Palmier en Pot' }}>
          <PottedPalm item={{} as any} actionState={{}} onSize={() => {}} />
        </group>

        {/* Rebounder */}
        <group position={[210, -3.48, -200]} rotation={[0, -Math.PI / 5, 0]} userData={{ animUnit: true, itemName: 'Rebound Jardin' }}>
          <Rebound item={{} as any} actionState={{}} onSize={() => {}} />
        </group>

        {/* Boîte de rangement Vättersö */}
        <group position={[264, 0, -320]} rotation={[0, -Math.PI / 2, 0]} userData={{ itemName: 'Boîte de Rangement Vättersö' }}>
          <Vatterso20562909 item={stub('vatterso-20562909')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>

        {/* Mangeoire à oiseaux sous le balcon */}
        <group position={[95, 214, -165]} userData={{ animUnit: true, skipMerge: true, itemName: 'Mangeoire à Oiseaux' }}>
          <BirdFeeder item={stub('bird-feeder')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>

        {/* Statues anatomiques (Chera - Squelette & Muscles) */}
        <group position={[30, 0, -220]} rotation={[0, Math.PI / 4, 0]} userData={{ animUnit: true, skipMerge: true, itemName: 'Anatomie Féminine (Squelette)' }}>
          <FemaleAnatomyBones item={{} as any} actionState={{}} onSize={() => {}} />
        </group>
        <group position={[30, 0, -280]} rotation={[0, Math.PI / 4, 0]} userData={{ animUnit: true, skipMerge: true, itemName: 'Anatomie Féminine (Muscles)' }}>
          <FemaleAnatomyMuscles item={{} as any} actionState={{}} onSize={() => {}} />
        </group>

        {/* Squelette Humain */}
        <group position={[700, 0, -700]} userData={{ animUnit: true, skipMerge: true, itemName: 'Squelette Humain' }}>
          <HumanSkeleton item={{} as any} actionState={{}} onSize={() => {}} />
        </group>
      </MergedStaticGroup>

      {/* Animaux autonomes (Robin Bird & Shiba Inu) */}
      <group userData={{ animUnit: true, noAnim: true, skipMerge: true, itemName: 'Oiseau Robin', hoverAction: { label: 'Oiseau Robin', actionId: 'robin-bird-replay' } }}>
        <RobinBird />
      </group>
      <group userData={{ animUnit: true, noAnim: true, skipMerge: true, itemName: 'Shiba Inu', hoverAction: { label: 'Shiba Inu', actionId: 'shiba-replay' } }}>
        <ShibaInu />
      </group>
    </>
  );
}
