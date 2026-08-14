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
import { ElectricRacket }                             from '@features/scene/items/ElectricRacket';
import { Drona }                                      from '@features/scene/items/Drona';
import { Walker, CHARACTERS }                         from '@features/scene/Walker';
import { ShibaInu }                                   from '@features/scene/items/ShibaInu';
import { RobinBird }                                  from '@features/scene/items/RobinBird';
import { Wig }                                        from '@features/scene/items/Wig';
import { RiggedWig }                                  from '@features/scene/items/RiggedWig';

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
  'electric-racket':        ElectricRacket,
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
  'wc-lid-toggle':         ['Ouvrir Couvercle', 'Fermer Couvercle'],
  'wc-seat-toggle':        ['Ouvrir Siège', 'Fermer Siège'],
  'wc-flush':              ['Appuyer sur la chasse', 'Relâcher la chasse'],
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
    return <Walker isPreview={true} previewCharacterId={char.id} isPaused={actionState?.isPaused} walkerAnim={actionState?.walkerAnim} previewHaircut={actionState?.previewHaircut} previewHairColor={actionState?.previewHairColor} />;
  } as any;
});

SCENE_REGISTRY['shiba-inu'] = function ShibaPreview({ actionState }: { actionState?: any }) {
  return <ShibaInu isPreview={true} previewAnim={actionState?.walkerAnim} />;
} as any;

SCENE_REGISTRY['robin-bird'] = function RobinBirdPreview({ actionState }: { actionState?: any }) {
  return <RobinBird isPreview={true} previewAnim={actionState?.walkerAnim} />;
} as any;

const WIGS = [
  { id: 'hair_100', name: 'Coupe #1 (Bob)' },
  { id: 'hair_101', name: 'Coupe #2 (Queue H.)' },
  { id: 'hair_102', name: 'Coupe #3 (Pixie)' },
  { id: 'hair_103', name: 'Coupe #4 (Wolf)' },
  { id: 'hair_104', name: 'Coupe #5 (Frange)' },
  { id: 'hair_105', name: 'Coupe #6 (Queue TT H.)' },
  { id: 'hair_106', name: 'Coupe #7 (Bob Frange)' },
  { id: 'hair_107', name: 'Coupe #8 (Couettes)' },
  { id: 'hair_108', name: 'Coupe #9 (Hérissée)' },
  { id: 'hair_109', name: 'Coupe #10 (Wavy Lob)' },
  { id: 'hair_110', name: 'Coupe #11 (Hime)' },
  { id: 'hair_111', name: 'Coupe #12 (Mi-tresse)' },
  { id: 'hair_112', name: 'Coupe #13 (Chignon)' },
  { id: 'hair_zepeto', name: 'Coupe #14 (Zepeto, zHairezt)' },
  { id: 'hair_pigtails', name: 'Coupe #15 (Longues Couettes Blanches, zHairezt)' },
  { id: 'hair_buns', name: 'Coupe #16 (Longs Chignons Buns, zHairezt)' },
  { id: 'hair_short_layers', name: 'Coupe #17 (Courte Dégradée, zHairezt)' },
  { id: 'hair_nmixx_hat_braids', name: 'Coupe #18 (NMIXX Bonnet & Tresses, zHairezt)' },
  { id: 'hair_very_long', name: 'Coupe #19 (Très Longue, zHairezt)' },
  { id: 'hair_two_braids_bangs', name: 'Coupe #20 (Deux Tresses Frange, zHairezt)' },
  { id: 'hair_aespa_short', name: 'Coupe #21 (Aespa Courte, zHairezt)' },
  { id: 'hair_wavy_ponytail', name: 'Coupe #22 (Queue de Cheval Ondulée, zHairezt)' },
  { id: 'hair_nimxx_short', name: 'Coupe #23 (NIMXX Courte V1, zHairezt)' },
  { id: 'hair_short_combed', name: 'Coupe #24 (Courte Plaquée Arrière, zHairezt)' },
  { id: 'hair_low_bun', name: 'Coupe #25 (Chignon Bas Frange, zHairezt)' },
  { id: 'hair_high_bun', name: 'Coupe #26 (Chignon Haut Frange, zHairezt)' },
  { id: 'hair_high_ponytail', name: 'Coupe #27 (Petite Queue de Cheval Haute, zHairezt)' },
  { id: 'hair_nmixx_short', name: 'Coupe #28 (NMIXX Courte V2, zHairezt)' },
  { id: 'hair_long_braids', name: 'Coupe #29 (Longues Tresses Frange, zHairezt)' },
  { id: 'hair_nmixx_16', name: 'Coupe #30 (NMIXX #16, zHairezt)' },
  { id: 'hair_zepeto_nmixx', name: 'Coupe #31 (Zepeto NMIXX, zHairezt)' },
  { id: 'hair_bob_buns', name: 'Coupe #32 (Carré Bob Buns, zHairezt)' },
  { id: 'hair_wavy_ponytails', name: 'Coupe #33 (Longues Couettes Ondulées Blanches, zHairezt)' },
  { id: 'hair_two_long_ponytails', name: 'Coupe #34 (Deux Longues Couettes, zHairezt)' },
  { id: 'hair_cyber_two_long_ponytails', name: 'Coupe #35 (Cyber Deux Longues Couettes, zHairezt)' },
  { id: 'hair_white_hair_with_bun', name: 'Coupe #36 (Cheveux Blancs avec Chignon, zHairezt)' },
  { id: 'hair_short_hair', name: 'Coupe #37 (Cheveux Courts, zHairezt)' },
  { id: 'hair_white_ponytail', name: 'Coupe #38 (Queue de Cheval Blanche, zHairezt)' },
  { id: 'hair_nmixx_hair_with_bangs', name: 'Coupe #39 (NMIXX avec Frange, zHairezt)' },
  { id: 'hair_two_white_ponytails', name: 'Coupe #40 (Deux Queues de Cheval Blanches, zHairezt)' },
  { id: 'hair_wolf_haircut', name: 'Coupe #41 (Coupe Wolf, zHairezt)' },
  { id: 'hair_white_bob_hairct', name: 'Coupe #42 (Carré Bob Blanc, zHairezt)' },
  { id: 'hair_scbe_hair_combed_to_one_side', name: 'Coupe #43 (Cheveux Plaqués sur le Côté, zHairezt)' },
  { id: 'hair_wavy_wet_white_hair', name: 'Coupe #44 (Cheveux Blancs Ondulés Mouillés, zHairezt)' },
  { id: 'hair_nyyd_wavy_hair', name: 'Coupe #45 (NYYD Ondulés, zHairezt)' },
  { id: 'hair_short_wavy_hair_with_bangs', name: 'Coupe #46 (Courts Ondulés avec Frange, zHairezt)' },
  { id: 'hair_nmixxhair_whith_bangs', name: 'Coupe #47 (NMIXX Frange V2, zHairezt)' },
  { id: 'hair_long_hair_styled_to_the_sides', name: 'Coupe #48 (Longs Stylisés sur les Côtés, zHairezt)' },
  { id: 'hair_wavy_long_hair_with_bangs', name: 'Coupe #49 (Longs Ondulés Frange, zHairezt)' },
  { id: 'hair_wavy_white_hair_to_one_side', name: 'Coupe #50 (Ondulés Blancs sur le Côté, zHairezt)' },
  { id: 'hair_high_white_bunponytail', name: 'Coupe #51 (Chignon/Queue Haut Blanc, zHairezt)' },
  { id: 'hair_white_hair_arraged_to_one_side', name: 'Coupe #52 (Cheveux Blancs Arrangés sur un Côté, zHairezt)' },
  { id: 'hair_black_long_hair', name: 'Coupe #53 (Longs Cheveux Noirs, zHairezt)' },
  { id: 'hair_blonde_ponytail_with_bangs', name: 'Coupe #54 (Queue de Cheval Blonde Frange, zHairezt)' },
  { id: 'hair_bratz_curly_hair', name: 'Coupe #55 (Bratz Bouclée, zHairezt)' },
  { id: 'hair_bratz_long_hair', name: 'Coupe #56 (Bratz Longue, zHairezt)' },
  { id: 'hair_chinook_wind_ponytail', name: 'Coupe #57 (Chinook Queue de Cheval, zHairezt)' },
  { id: 'hair_hair_bitten', name: 'Coupe #58 (Bitten, zHairezt)' },
  { id: 'hair_kcon_long_hair', name: 'Coupe #59 (KCON Longue, zHairezt)' },
  { id: 'hair_long_down_ponytail', name: 'Coupe #60 (Longue Queue de Cheval Basse, zHairezt)' },
  { id: 'hair_long_hair_cut_in_layers', name: 'Coupe #61 (Longue Dégradée, zHairezt)' },
  { id: 'hair_long_hair_with_bow', name: 'Coupe #62 (Longue avec Nœud, zHairezt)' },
  { id: 'hair_medium_short_hair_combed_to_the_sides', name: 'Coupe #63 (Mi-Courte sur les Côtés, zHairezt)' },
  { id: 'hair_nmixx_white_hair', name: 'Coupe #64 (NMIXX Blanche, zHairezt)' },
  { id: 'hair_nmixx_white_longshort_hair', name: 'Coupe #65 (NMIXX Blanche Long/Court, zHairezt)' },
  { id: 'hair_noicepotatonp_osanahair', name: 'Coupe #66 (Osana, zHairezt)' },
  { id: 'hair_side_swept_curls', name: 'Coupe #67 (Boucles Balayées sur le Côté, zHairezt)' },
  { id: 'hair_straight_long_white_hair', name: 'Coupe #68 (Longs Cheveux Lisses Blancs, zHairezt)' },
  { id: 'hair_two_braids_with_red_ties', name: 'Coupe #69 (Deux Tresses Attaches Rouges, zHairezt)' },
  { id: 'hair_vcha_long_white_hair', name: 'Coupe #70 (VCHA Longue Blanche, zHairezt)' },
  { id: 'hair_wavy_hair_arranged_to_one_side', name: 'Coupe #71 (Ondulés sur un Côté, zHairezt)' },
  { id: 'hair_wavy_hair_with_bangs_02', name: 'Coupe #72 (Ondulés Frange V2, zHairezt)' },
  { id: 'hair_white_long_wavy_hair', name: 'Coupe #73 (Longs Blancs Ondulés, zHairezt)' }
];

WIGS.forEach(wig => {
  SCENE_REGISTRY[wig.id] = function WigPreview() {
    if (
      [
        'hair_zepeto', 'hair_pigtails', 'hair_buns', 'hair_short_layers', 
        'hair_nmixx_hat_braids', 'hair_very_long', 'hair_two_braids_bangs', 
        'hair_aespa_short', 'hair_wavy_ponytail', 'hair_nimxx_short',
        'hair_short_combed', 'hair_low_bun', 'hair_high_bun',
        'hair_high_ponytail', 'hair_nmixx_short', 'hair_long_braids',
        'hair_nmixx_16', 'hair_zepeto_nmixx', 'hair_bob_buns', 'hair_wavy_ponytails',
        'hair_two_long_ponytails', 'hair_cyber_two_long_ponytails', 'hair_white_hair_with_bun',
        'hair_short_hair', 'hair_white_ponytail', 'hair_nmixx_hair_with_bangs',
        'hair_two_white_ponytails', 'hair_wolf_haircut', 'hair_white_bob_hairct',
        'hair_scbe_hair_combed_to_one_side', 'hair_wavy_wet_white_hair', 'hair_nyyd_wavy_hair',
        'hair_short_wavy_hair_with_bangs', 'hair_nmixxhair_whith_bangs', 'hair_long_hair_styled_to_the_sides',
        'hair_wavy_long_hair_with_bangs', 'hair_wavy_white_hair_to_one_side', 'hair_high_white_bunponytail',
        'hair_white_hair_arraged_to_one_side',
        'hair_black_long_hair', 'hair_blonde_ponytail_with_bangs', 'hair_bratz_curly_hair',
        'hair_bratz_long_hair', 'hair_chinook_wind_ponytail', 'hair_hair_bitten',
        'hair_kcon_long_hair', 'hair_long_down_ponytail', 'hair_long_hair_cut_in_layers',
        'hair_long_hair_with_bow', 'hair_medium_short_hair_combed_to_the_sides', 'hair_nmixx_white_hair',
        'hair_nmixx_white_longshort_hair', 'hair_noicepotatonp_osanahair', 'hair_side_swept_curls',
        'hair_straight_long_white_hair', 'hair_two_braids_with_red_ties', 'hair_vcha_long_white_hair',
        'hair_wavy_hair_arranged_to_one_side', 'hair_wavy_hair_with_bangs_02', 'hair_white_long_wavy_hair'
      ].includes(wig.id)
    ) {
      return <RiggedWig id={wig.id} scale={1} />;
    }
    return <Wig id={wig.id} scale={1} />;
  } as any;
});


import { Blaskata50569513 } from '@features/scene/items/Blaskata50569513';
SCENE_REGISTRY['blaskata50569513'] = Blaskata50569513 as any;
