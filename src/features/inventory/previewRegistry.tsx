import { Jumper } from '@features/scene/items/Jumper';
import { UnitreeG1, UnitreeGo2 } from '@features/scene/items/Unitree';
import { Raskog30586783 } from '@features/scene/items/Raskog30586783';
import { Boholmen99157501 } from '@features/scene/items/Boholmen99157501';
import { Utdrag10389142 } from '@features/scene/items/Utdrag10389142';
import { Valbildad20467592 } from '@features/scene/items/Valbildad20467592';
import { Havback49514017 } from '@features/scene/items/Havback49514017';
import { Vallamosse10349660 } from '@features/scene/items/Vallamosse10349660';
import { Brogrund70333982 } from '@features/scene/items/Brogrund70333982';
import { Brogrund30328534 } from '@features/scene/items/Brogrund30328534';
import { Lillviken20317852 } from '@features/scene/items/Lillviken20317852';
import { Vallamosse10349655 } from '@features/scene/items/Vallamosse10349655';
import { Nissedal30320321 } from '@features/scene/items/Nissedal30320321';
import { Nissedal70320319 } from '@features/scene/items/Nissedal70320319';
import { Nissedal50320320 } from '@features/scene/items/Nissedal50320320';
import { Tisken40381253 } from '@features/scene/items/Tisken40381253';
import { Vathult40467548 } from '@features/scene/items/Vathult40467548';
import { Klyket50503598 } from '@features/scene/items/Klyket50503598';
import { Enudden60251665 } from '@features/scene/items/Enudden60251665';
import { Ikea20480013 } from '@features/scene/items/Ikea20480013';
import { Uppdatera40546471 } from '@features/scene/items/Uppdatera40546471';
import { Storavan80423816 } from '@features/scene/items/Storavan80423816';
import { Sekiner60498110 } from '@features/scene/items/Sekiner60498110';
import { Myggspray70604186 } from '@features/scene/items/Myggspray70604186';
import { Dirigera10503406 } from '@features/scene/items/Dirigera10503406';
import { Kabbleka10609667 } from '@features/scene/items/Kabbleka10609667';
import { Bilresa70604172 } from '@features/scene/items/Bilresa70604172';
import { Kolvatten00594176 } from '@features/scene/items/Kolvatten00594176';
import { Rinnig30407814 } from '@features/scene/items/Rinnig30407814';
import { Middagsmat60463714 } from '@features/scene/items/Middagsmat60463714';
import { Annons80298474 } from '@features/scene/items/Annons80298474';
import { Tasjon80392023 } from '@features/scene/items/Tasjon80392023';
import { Pepprig70567650 } from '@features/scene/items/Pepprig70567650';
import { Metod50205532 } from '@features/scene/items/Metod50205532';
import { Ikea36590066708 } from '@features/scene/items/Ikea36590066708';
/**
 * Registry des composants TSX dédiés par item.id.
 * Uniquement pour les items interactifs (open/close) ou procéduraux (pas de glbPath).
 * Les items avec glbPath sont gérés directement par GlbScene dans InventoryPreview.
 */
import { useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { WIGS_ITEMS }                                from './inventoryData';
import { Freezer }                                    from '@features/scene/items/Freezer';
import { Fridge }                                     from '@features/scene/items/Fridge';
import { KitchenCabinet }                             from '@features/scene/items/KitchenCabinet';
import { BathroomCabinetWest, BathroomCabinetEast }  from '@features/scene/items/BathroomCabinet';
import { DoorEntry }                                  from '@features/scene/items/DoorEntry';
import { DoorLiving, DoorBath }                        from '@features/scene/items/DoorWhite';
import { DoorFrame }                                  from '@features/scene/items/DoorFrame';
import { GlassDoor }                                  from '@features/scene/items/GlassDoor';
import { Toilet }                                     from '@features/scene/items/Toilet';
import { Lillhavet80461276 } from '@features/scene/items/Lillhavet80461276';
import { WaterHeater }                                from '@features/scene/items/WaterHeater';
import { CorridorCloset }                             from '@features/scene/items/CorridorCloset';
import { SdbCloset }                                  from '@features/scene/items/SdbCloset';
import { TV }                                         from '@features/scene/items/TV';
import { Laptop }                                     from '@features/scene/items/Laptop';
import { Phone }                                      from '@features/scene/items/Phone';
import { AirPerformer }                               from '@features/scene/items/AirPerformer';
import { ArmrestSofa }                                from '@features/scene/items/ArmrestSofa';
import { ArmlessSofa }                                from '@features/scene/items/ArmlessSofa';
import { Bathtub }                                    from '@features/scene/items/Bathtub';
import { ChestBench }                                 from '@features/scene/items/ChestBench';
import { ShoeHatRack } from '@features/scene/items/ShoeHatRack';
import { SHOE_HAT_RACK } from '@features/scene/shoeHatRackData';
import { AltappenRug }                                from '@features/scene/items/AltappenRug';
import { JordanHexMule }                              from '@features/scene/items/JordanHexMule';
import { SummerOutdoorBoot }                           from '@features/scene/items/SummerOutdoorBoot';
import { WinterOutdoorBoot }                           from '@features/scene/items/WinterOutdoorBoot';
import { SneakersRed }                                from '@features/scene/items/SneakersRed';
import { MackaparGroup }                              from '@features/scene/items/MackaparGroup';
import { RaskogLargeGroup }                             from '@features/scene/items/RaskogLargeGroup';
import { CuisineGroup }                               from '@features/scene/items/CuisineGroup';
import { KallaxNE }                                   from '@features/scene/items/KallaxNE';
import { KallaxSE }                                   from '@features/scene/items/KallaxSE';
import { KallaxNW }                                   from '@features/scene/items/KallaxNW';
import { KallaxCuisine }                              from '@features/scene/items/KallaxCuisine';
import { MeubleT }                                    from '@features/scene/items/MeubleT';
import { UtakerStack }                                from '@features/scene/items/UtakerStack';
import { Bollsidan30574370 }                          from '@features/scene/items/Bollsidan30574370';
import { MannequinHead, LaraWigBust }                 from '@features/scene/items/MannequinHead';
import { Backpack }                                   from '@features/scene/items/Backpack';
import { BaseballCap }                                from '@features/scene/items/BaseballCap';
import { Kejserlig90511501 }                          from '@features/scene/items/Kejserlig90511501';
import { Counter }                                    from '@features/scene/items/Counter';
import { NissedalMirror }                             from '@features/scene/items/NissedalMirror';
import { NinjaSP101 }                                 from '@features/scene/items/NinjaSP101';
import { MllseG2Pro }                                 from '@features/scene/items/MllseG2Pro';
import { MatterHub }                                  from '@features/scene/items/MatterHub';
import { JblCharge3 }                                 from '@features/scene/items/JblCharge3';
import { TrashBin }                                   from '@features/scene/items/TrashBin';
import { VacuumCleaner }                              from '@features/scene/items/VacuumCleaner';
import { Vihals }                                     from '@features/scene/items/Vihals';
import { Linky }                                      from '@features/scene/items/Linky';
import { Scooter, SCOOTER_STEERING_ANGLE }              from '@features/scene/items/Scooter';
import { LaserDistanceMaster }                        from '@features/scene/items/LaserDistanceMaster';
import { ElectricRacket }                             from '@features/scene/items/ElectricRacket';
import { Drona }                                      from '@features/scene/items/Drona';
import { CharacterGroup }                               from '@features/scene/character';
import { CHARACTERS }                                 from '@features/scene/characterConfig';
import { DogBowl } from '@features/scene/items/DogBowl';
import { Dachshund } from '@features/scene/items/Dachshund';
import { ShibaInu }                                   from '@features/scene/items/ShibaInu';
import { resolveAnimationId } from '@features/scene/animations/animationResolver';
import { Goldfish } from '@features/scene/items/Goldfish';
import { RobinBird }                                  from '@features/scene/items/RobinBird';
import { BlackHornetDrone }                            from '@features/scene/items/BlackHornetDrone';
import { BirdFeeder }                                 from '@features/scene/items/BirdFeeder';
import { GoogleNestMini }                             from '@features/scene/items/GoogleNestMini';
import { Lagerpoppel00561816 }                         from '@features/scene/items/Lagerpoppel00561816';

import { Smorkull } from '@features/scene/items/Smorkull';
import { TShirt } from '@features/scene/items/TShirt';
import { MaillotInyeong } from '@features/scene/items/MaillotInyeong';
import { DoubleVenusPendant } from '@features/scene/items/DoubleVenusPendant';

function ScooterPreview(props: SceneItemProps) {
  return (
    <group rotation-y={-5 * Math.PI / 180}>
      <Scooter {...props} steeringAngle={props.actionState['scooter-steering-toggle'] ? SCOOTER_STEERING_ANGLE : 0} />
    </group>
  );
}

function ShoeHatRackPreview(props: SceneItemProps) {
  return (
    <group position={[-SHOE_HAT_RACK.width / 2, 0, -SHOE_HAT_RACK.depth / 2]}>
      <ShoeHatRack {...props} noCaps />
    </group>
  );
}

export const SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {
  'jumper-robot': Jumper,
  'unitree-g1': UnitreeG1,
  'unitree-go2': UnitreeGo2,
  'ikea36590066708':        Ikea36590066708,
  'shoe-hat-rack':          ShoeHatRackPreview,
  'scooter':                ScooterPreview,
  'smorkull-chair':         Smorkull,
  'bird-feeder':            BirdFeeder,
  'raskog30586783': Raskog30586783,
  'boholmen99157501': Boholmen99157501,
  'utdrag10389142': Utdrag10389142,
  'valbildad20467592': Valbildad20467592,
  'havback49514017': Havback49514017,
  'vallamosse10349660': Vallamosse10349660,
  'brogrund70333982': Brogrund70333982,
  'brogrund30328534': Brogrund30328534,
  'lillviken20317852': Lillviken20317852,
  'vallamosse10349655': Vallamosse10349655,
  'nissedal30320321': Nissedal30320321,
  'nissedal70320319': Nissedal70320319,
  'nissedal50320320': Nissedal50320320,
  'tisken40381253': Tisken40381253,
  'vathult40467548': Vathult40467548,
  'tasjon80392023': Tasjon80392023,
  'klyket50503598': Klyket50503598,
  'enudden60251665': Enudden60251665,
  'ikea20480013': Ikea20480013,
  'uppdatera40546471': Uppdatera40546471,
  'storavan80423816': Storavan80423816,
  'sekiner60498110': Sekiner60498110,
  'myggspray70604186': Myggspray70604186,
  'dirigera10503406': Dirigera10503406,
  'kabbleka10609667': Kabbleka10609667,
  'bilresa70604172': Bilresa70604172,
  'kolvatten00594176': Kolvatten00594176,
  'rinnig30407814': Rinnig30407814,
  'middagsmat60463714': Middagsmat60463714,
  'annons80298474': Annons80298474,
  'pepprig70567650': Pepprig70567650,
  'metod50205532': Metod50205532,
  // ── Interactifs (open/close) ───────────────────────────────────────────────
  'freezer':                Freezer,
  'fridge':                 props => <Fridge {...props} isPreview />,
  'cabinet-wood':           KitchenCabinet,
  'bathroom-cabinet-west':  BathroomCabinetWest,
  'bathroom-cabinet-east':  BathroomCabinetEast,
  'door-entry':             DoorEntry,
  'door-living':            DoorLiving,
  'door-sdb':               DoorBath,
  'door-glass':             GlassDoor,
  'door-frame':             DoorFrame,
  'lillhavet80461276':      Lillhavet80461276,
  'toilet':                 Toilet,
  'corridor-closet':        CorridorCloset,
  'sdb-closet':             SdbCloset,
  'drona':                  Drona,

  // ── Procéduraux (pas de glbPath) ──────────────────────────────────────────
  'counter':                Counter,
  'sink-boholmen':          Boholmen99157501,
  'water-heater':           WaterHeater,
  'tv':                     TV,
  'laptop':                 Laptop,
  'phone':                  Phone,
  'air-performer':          AirPerformer,
  'armrest-sofa':           ArmrestSofa,
  'armless-sofa':           ArmlessSofa,
  'bathtub':                Bathtub,
  'chest-bench':            ChestBench,
  'altappen-rug':           AltappenRug,
  'jordan-hex-mule':        JordanHexMule,
  'summer-outdoor-boot':    SummerOutdoorBoot,
  'winter-outdoor-boot':    WinterOutdoorBoot,
  'sneaker':                SneakersRed,
  'sneakers-red':           SneakersRed,
  'meuble-t':               MeubleT,
  'utaker-stack':           UtakerStack,
  'utaker-lower':           UtakerStack,
  'utaker-upper':           UtakerStack,
  'desk-bollsidan':         Bollsidan30574370,
  'bollsidan30574370':      Bollsidan30574370,
  'mannequin-head':         MannequinHead,
  'backpack':               Backpack,
  'baseball-cap':           BaseballCap,
  'mug':                    Kejserlig90511501,
  'kejserlig90511501':      Kejserlig90511501,
  'mirror-nissedal-wide':   NissedalMirror,
  'mirror-nissedal-a':      NissedalMirror,
  'mirror-nissedal-d':      NissedalMirror,
  'ninja-sp101':            NinjaSP101,
  'mini-pc':                MllseG2Pro,
  'matter-hub':             MatterHub,
  'linky':                  Linky,
  'laser-distancemaster':   LaserDistanceMaster,
  'electric-racket':        ElectricRacket,
  'sony-srs-xb33':          JblCharge3,
  'trash-bin':              TrashBin,
  'vacuum-cleaner':         VacuumCleaner,
  'vihals-chair':           Vihals,
  'google-nest-mini':       GoogleNestMini,
  'lagerpoppel00561816':    Lagerpoppel00561816,
  'tshirt-noir-L':          TShirt,
  'tshirt-noir-XL':         TShirt,
  'maillot-coreen-inyeong': MaillotInyeong,
  'double-venus-pendant':   DoubleVenusPendant,

  // ── Composites (assemblages multi-pièces) ─────────────────────────────────
  'kallax-ne-stack':        KallaxNE,
  'kallax-sw-stack':        KallaxCuisine,
  'kallax-se-stack':        KallaxSE,
  'kallax-nw-stack':        KallaxNW,
  'mackapar-stack':         MackaparGroup,
  'raskog-large-stack':        RaskogLargeGroup,
  'cuisine-stack':          CuisineGroup,
};

CHARACTERS.forEach(char => {
  SCENE_REGISTRY[char.id] = function DynamicPreview({ actionState, onSize }: { actionState?: any; onSize?: SceneItemProps['onSize'] }) {
    return (
      <>
        <CharacterGroup
          isPreview={true}
          previewCharacterId={char.id}
          isPaused={actionState?.isPaused}
          characterAnim={actionState?.characterAnim}
          duoAnimDef={actionState?.duoAnimDef}
          duoPartnerId={actionState?.duoPartnerId}
          previewHaircut={actionState?.previewHaircut}
          previewHairColor={actionState?.previewHairColor}
        />
        {!actionState?.duoAnimDef && resolveAnimationId(actionState?.characterAnim || 'idle') === 'ff-dancewithdog' &&
          <ShibaInu isPreview dancePreview previewAnim="Dog|Jump" onSize={onSize} />}
      </>
    );
  } as any;
});

SCENE_REGISTRY['ushiro'] = function ShibaPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <ShibaInu isPreview={true} previewAnim={actionState?.characterAnim} onSize={onSize} />;
} as any;
SCENE_REGISTRY['shiba-inu'] = SCENE_REGISTRY['ushiro'];
SCENE_REGISTRY['ulotte-bowl'] = DogBowl;
SCENE_REGISTRY['ulotte'] = function UlottePreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <Dachshund isPreview previewAnim={actionState?.['ulotte-motion'] ?? actionState?.characterAnim ?? 'idle-1'} onSize={onSize} />;
};

SCENE_REGISTRY['robin-bird'] = function RobinBirdPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <RobinBird isPreview={true} previewAnim={actionState?.characterAnim} onSize={onSize} />;
} as any;

SCENE_REGISTRY['black-hornet-drone'] = function BlackHornetDronePreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <BlackHornetDrone isPreview={true} previewAnim={actionState?.characterAnim} onSize={onSize} />;
} as any;

SCENE_REGISTRY['jikin-goldfish'] = function GoldfishPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <Goldfish isPreview previewAnim={actionState?.characterAnim || 'idle'} onSize={onSize} />;
};

SCENE_REGISTRY['tosakin-goldfish'] = function TosakinPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <Goldfish species="tosakin" isPreview previewAnim={actionState?.characterAnim || 'idle'} onSize={onSize} />;
};

function AnimatedBustGroup({
  children,
  basePosition,
  enabled,
  phaseOffset = 0,
}: {
  children: React.ReactNode;
  basePosition: [number, number, number];
  enabled: boolean;
  phaseOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (enabled) {
      const t = state.clock.elapsedTime * 2.2 + phaseOffset;
      // Translation sur les 3 axes (X, Y, Z) en cm (simulation de mouvements naturels du torse)
      const tx = Math.sin(t * 1.1) * 3.5;
      const ty = Math.sin(t * 2.2) * 1.2;
      const tz = Math.cos(t * 1.4) * 2.8;
      groupRef.current.position.set(
        basePosition[0] + tx,
        basePosition[1] + ty,
        basePosition[2] + tz
      );

      // Rotations sur les 3 axes (Roll, Pitch, Yaw)
      const rx = Math.sin(t * 1.7) * 0.16; // Hochement / inclinaison avant-arrière
      const ry = Math.sin(t * 0.9) * 0.32; // Rotation gauche-droite du regard
      const rz = Math.cos(t * 1.3) * 0.10; // Balancement latéral de la tête
      groupRef.current.rotation.set(rx, ry, rz);
    } else {
      // Retour fluide au repos
      const step = Math.min(1, delta * 6);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, basePosition[0], step);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, basePosition[1], step);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, basePosition[2], step);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, step);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, step);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, step);
    }
  });

  return (
    <group ref={groupRef} position={basePosition}>
      {children}
    </group>
  );
}

WIGS_ITEMS.forEach(wig => {
  SCENE_REGISTRY[wig.id] = function WigPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
    const hairColor = actionState?.previewHairColor;
    const laraVariant = actionState?.previewLaraVariant || 'native';
    const simulateMotion = actionState?.simulateMotion !== undefined ? Boolean(actionState.simulateMotion) : true;
    return (
      <group>
        <AnimatedBustGroup basePosition={[-14, 0, 0]} enabled={simulateMotion} phaseOffset={0}>
          <MannequinHead
            mannequinId={`preview-${wig.id}`}
            wigId={wig.id}
            hairColor={hairColor}
            windEnabled={simulateMotion}
            item={{} as any}
            actionState={actionState || {}}
            onSize={onSize || (() => {})}
          />
        </AnimatedBustGroup>
        <AnimatedBustGroup basePosition={[14, 0, 0]} enabled={simulateMotion} phaseOffset={Math.PI * 0.45}>
          <LaraWigBust
            wigId={wig.id}
            hairColor={hairColor}
            laraVariant={laraVariant}
            windEnabled={simulateMotion}
          />
        </AnimatedBustGroup>
      </group>
    );
  } as any;
});


import { Blaskata50569513 } from '@features/scene/items/Blaskata50569513';

SCENE_REGISTRY['blaskata50569513'] = Blaskata50569513 as any;
