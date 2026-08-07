/**
 * Registry des composants TSX dédiés par item.id.
 * Uniquement pour les items interactifs (open/close) ou procéduraux (pas de glbPath).
 * Les items avec glbPath sont gérés directement par GlbScene dans InventoryPreview.
 */
import type { ComponentType } from 'react';
import type { SceneItemProps } from '@shared/types';
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
import { AltappenRug }                                from '@features/scene/items/AltappenRug';
import { JordanHexMule }                              from '@features/scene/items/JordanHexMule';
import { SummerOutdoorBoot }                           from '@features/scene/items/SummerOutdoorBoot';
import { WinterOutdoorBoot }                           from '@features/scene/items/WinterOutdoorBoot';
import { Sneakers }                                   from '@features/scene/items/Sneakers';
import { MackaparGroup }                              from '@features/scene/items/MackaparGroup';
import { RaskogLargeGroup }                             from '@features/scene/items/RaskogLargeGroup';
import { CuisineGroup }                               from '@features/scene/items/CuisineGroup';
import { KallaxNE }                                   from '@features/scene/items/KallaxNE';
import { KallaxSE }                                   from '@features/scene/items/KallaxSE';
import { KallaxNW }                                   from '@features/scene/items/KallaxNW';
import { KallaxCuisine }                              from '@features/scene/items/KallaxCuisine';
import { MeubleT }                                    from '@features/scene/items/MeubleT';
import { UtakerStack }                                from '@features/scene/items/UtakerStack';
import { BollsidanDesk }                              from '@features/scene/items/BollsidanDesk';
import { MannequinHead }                              from '@features/scene/items/MannequinHead';
import { Backpack }                                   from '@features/scene/items/Backpack';
import { BaseballCap }                                from '@features/scene/items/BaseballCap';
import { Mug }                                        from '@features/scene/items/Mug';
import { Counter }                                    from '@features/scene/items/Counter';
import { SinkBoholmen }                               from '@features/scene/items/SinkBoholmen';
import { NissedalMirror }                             from '@features/scene/items/NissedalMirror';
import { NinjaSP101 }                                 from '@features/scene/items/NinjaSP101';
import { MllseG2Pro }                                 from '@features/scene/items/MllseG2Pro';
import { MatterHub }                                  from '@features/scene/items/MatterHub';
import { JblCharge3 }                                 from '@features/scene/items/JblCharge3';
import { TrashBin }                                   from '@features/scene/items/TrashBin';
import { VacuumCleaner }                              from '@features/scene/items/VacuumCleaner';
import { Tent }                                       from '@features/scene/items/Tent';
import { Vihals }                                     from '@features/scene/items/Vihals';
import { Rebound }                                    from '@features/scene/items/Rebound';
import { Linky }                                      from '@features/scene/items/Linky';
import { BimDoubleDoor }                              from '@features/scene/items/BimDoubleDoor';
import { LaserDistanceMaster }                        from '@features/scene/items/LaserDistanceMaster';
import { Drona }                                      from '@features/scene/items/Drona';
import { Walker, CHARACTERS }                         from '@features/scene/Walker';
export const SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {
  // ── Interactifs (open/close) ───────────────────────────────────────────────
  'freezer':                Freezer,
  'fridge':                 Fridge,
  'cabinet-wood':           KitchenCabinet,
  'bathroom-cabinet-west':  BathroomCabinetWest,
  'bathroom-cabinet-east':  BathroomCabinetEast,
  'door-entry':             DoorEntry,
  'door-living':            DoorLiving,
  'door-sdb':               DoorBath,
  'door-glass':             GlassDoor,
  'door-bim-double':        BimDoubleDoor,
  'door-frame':             DoorFrame,
  'lillhavet80461276':      Lillhavet80461276,
  'toilet':                 Toilet,
  'corridor-closet':        CorridorCloset,
  'sdb-closet':             SdbCloset,
  'drona':                  Drona,

  // ── Procéduraux (pas de glbPath) ──────────────────────────────────────────
  'counter':                Counter,
  'sink-boholmen':          SinkBoholmen,
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
  'sneaker':                Sneakers,
  'meuble-t':               MeubleT,
  'utaker-stack':           UtakerStack,
  'desk-bollsidan':         BollsidanDesk,
  'mannequin-head':         MannequinHead,
  'backpack':               Backpack,
  'baseball-cap':           BaseballCap,
  'mug':                    Mug,
  'mirror-nissedal-wide':   NissedalMirror,
  'nissedal50320320':       NissedalMirror,
  'ninja-sp101':            NinjaSP101,
  'mini-pc':                MllseG2Pro,
  'matter-hub':             MatterHub,
  'linky':                  Linky,
  'laser-distancemaster':   LaserDistanceMaster,
  'sony-srs-xb33':          JblCharge3,
  'trash-bin':              TrashBin,
  'vacuum-cleaner':         VacuumCleaner,
  'tent-quechua-2sec':      Tent,
  'vihals-chair':           Vihals,
  'tyco-rebound':           Rebound,

  // ── Composites (assemblages multi-pièces) ─────────────────────────────────
  'kallax-ne-stack':        KallaxNE,
  'kallax-sw-stack':        KallaxCuisine,
  'kallax-se-stack':        KallaxSE,
  'kallax-nw-stack':        KallaxNW,
  'mackapar-stack':         MackaparGroup,
  'raskog-large-stack':        RaskogLargeGroup,
  'cuisine-stack':          CuisineGroup,
};

/**
 * Labels des boutons d'action.
 * [label quand inactif, label quand actif]
 */
export const ACTION_LABELS: Record<string, [string, string]> = {
  'freezer-toggle':        ['Ouvrir', 'Fermer'],
  'fridge-toggle':         ['Ouvrir', 'Fermer'],
  'cabinet-toggle':        ['Ouvrir', 'Fermer'],
  'cbn-west-toggle':       ['Ouvrir', 'Fermer'],
  'cbn-east-toggle':       ['Ouvrir', 'Fermer'],
  'entry-door-toggle':     ['Ouvrir', 'Fermer'],
  'living-door-toggle':    ['Ouvrir', 'Fermer'],
  'bathroom-door-toggle':  ['Ouvrir', 'Fermer'],
  'east-glass-door-toggle':           ['Ouvrir', 'Fermer'],
  'bim-door-left-open':               ['Ouvrir Gauche', 'Fermer Gauche'],
  'bim-door-right-open':              ['Ouvrir Droit', 'Fermer Droit'],
  'wc-lid-toggle':         ['Ouvrir', 'Fermer'],
  'corr-doors-toggle':     ['Ouvrir', 'Fermer'],
  'sdb-closet-toggle':     ['Ouvrir', 'Fermer'],
  'ninja-toggle':          ['Ouvrir', 'Fermer'],
  'tv-toggle':             ['Allumer', 'Éteindre'],
  'bin-toggle':            ['Ouvrir', 'Fermer'],
  'bed-toggle':            ['Désempiler', 'Empiler'],
  'bed-sofa':              ['Canapé', 'Lit'],
  'bed-position':          ['Position →', 'Position →'],
  'desk1-toggle':          ['Debout', 'Assis'],
  'desk1-position':        ['Position →', 'Position →'],
  'desk2-toggle':          ['Debout', 'Assis'],
  'desk2-position':        ['Position →', 'Position →'],
  'smorkull-position':     ['Position →', 'Position →'],
  'vihals-toggle':         ['Plier', 'Déplier'],
  'sofa-arm-left':         ['Mettre à plat G', 'Relever G'],
  'sofa-arm-right':        ['Mettre à plat D', 'Relever D'],
};

CHARACTERS.forEach(char => {
  SCENE_REGISTRY[char.id] = function DynamicPreview({ actionState }: { actionState?: any }) {
    return <Walker isPreview={true} previewCharacterId={char.id} showSkeleton={actionState?.showBones} isPaused={actionState?.isPaused} walkerAnim={actionState?.walkerAnim} />;
  } as any;
});
