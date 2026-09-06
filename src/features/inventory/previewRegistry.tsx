import { Kallax20275814 } from '@features/scene/items/Kallax20275814';
import { Kallax90301555 } from '@features/scene/items/Kallax90301555';
import { Kallax20301554 } from '@features/scene/items/Kallax20301554';
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
/**
 * Registry des composants TSX dédiés par item.id.
 * Uniquement pour les items interactifs (open/close) ou procéduraux (pas de glbPath).
 * Les items avec glbPath sont gérés directement par GlbScene dans InventoryPreview.
 */
import type { ComponentType } from 'react';
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
import { MannequinHead }                              from '@features/scene/items/MannequinHead';
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
import { Tent }                                       from '@features/scene/items/Tent';
import { Vihals }                                     from '@features/scene/items/Vihals';
import { Rebound }                                    from '@features/scene/items/Rebound';
import { Linky }                                      from '@features/scene/items/Linky';
import { LaserDistanceMaster }                        from '@features/scene/items/LaserDistanceMaster';
import { ElectricRacket }                             from '@features/scene/items/ElectricRacket';
import { Drona }                                      from '@features/scene/items/Drona';
import { Walker }                                      from '@features/scene/Walker';
import { CHARACTERS }                                 from '@features/scene/walkerConfig';
import { ShibaInu }                                   from '@features/scene/items/ShibaInu';
import { RobinBird }                                  from '@features/scene/items/RobinBird';
import { BirdFeeder }                                 from '@features/scene/items/BirdFeeder';
import { GoogleNestMini }                             from '@features/scene/items/GoogleNestMini';
import { Lagerpoppel00561816 }                         from '@features/scene/items/Lagerpoppel00561816';

import { Smorkull } from '@features/scene/items/Smorkull';

export const SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {
  'smorkull-chair':         Smorkull,
  'bird-feeder':            BirdFeeder,
  'kallax20275814': Kallax20275814,
  'kallax90301555': Kallax90301555,
  'kallax20301554': Kallax20301554,
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
  'tent-quechua-2sec':      Tent,
  'vihals-chair':           Vihals,
  'tyco-rebound':           Rebound,
  'google-nest-mini':       GoogleNestMini,
  'lagerpoppel00561816':    Lagerpoppel00561816,

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
  'wc-lid-toggle':         ['Ouvrir Couvercle', 'Fermer Couvercle'],
  'wc-seat-toggle':        ['Ouvrir Siège', 'Fermer Siège'],
  'wc-flush':              ['Appuyer sur la chasse', 'Relâcher la chasse'],
  'corr-doors-toggle':     ['Ouvrir', 'Fermer'],
  'sdb-closet-toggle':     ['Ouvrir', 'Fermer'],
  'ninja-toggle':          ['Ouvrir', 'Fermer'],
  'tv-toggle':             ['Allumer', 'Éteindre'],
  'bin-toggle':            ['Ouvrir', 'Fermer'],
  'bed-double':            ['Mettre en lit double', 'Séparer en lits simples'],
  'bed-position':          ['Position lit double →', 'Position lit double →'],
  'desk-toggle':           ['Debout', 'Assis'],
  'desk1-toggle':          ['Debout', 'Assis'],
  'desk1-position':        ['Position →', 'Position →'],
  'desk2-toggle':          ['Debout', 'Assis'],
  'desk2-position':        ['Position →', 'Position →'],
  'smorkull-position':     ['Position →', 'Position →'],
  'vihals-toggle':         ['Plier', 'Déplier'],
  'sofa-arm-left':         ['Mettre à plat G', 'Relever G'],
  'sofa-arm-right':        ['Mettre à plat D', 'Relever D'],
  'nestMini':              ['Ok Google 🎙️', 'Ok Google 🎙️'],
};

CHARACTERS.forEach(char => {
  SCENE_REGISTRY[char.id] = function DynamicPreview({ actionState }: { actionState?: any }) {
    return (
      <Walker
        isPreview={true}
        previewCharacterId={char.id}
        isPaused={actionState?.isPaused}
        walkerAnim={actionState?.walkerAnim}
        duoAnimDef={actionState?.duoAnimDef}
        duoPartnerId={actionState?.duoPartnerId}
        previewHaircut={actionState?.previewHaircut}
        previewHairColor={actionState?.previewHairColor}
      />
    );
  } as any;
});

SCENE_REGISTRY['ushiro'] = function ShibaPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <ShibaInu isPreview={true} previewAnim={actionState?.walkerAnim} onSize={onSize} />;
} as any;
SCENE_REGISTRY['shiba-inu'] = SCENE_REGISTRY['ushiro'];

SCENE_REGISTRY['robin-bird'] = function RobinBirdPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
  return <RobinBird isPreview={true} previewAnim={actionState?.walkerAnim} onSize={onSize} />;
} as any;

WIGS_ITEMS.forEach(wig => {
  SCENE_REGISTRY[wig.id] = function WigPreview({ actionState, onSize }: { actionState?: any; onSize?: any }) {
    return (
      <MannequinHead
        mannequinId={`preview-${wig.id}`}
        wigId={wig.id}
        hairColor={actionState?.previewHairColor}
        windEnabled={false}
        item={{} as any}
        actionState={actionState || {}}
        onSize={onSize || (() => {})}
      />
    );
  } as any;
});


import { Blaskata50569513 } from '@features/scene/items/Blaskata50569513';
SCENE_REGISTRY['blaskata50569513'] = Blaskata50569513 as any;
