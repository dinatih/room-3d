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
import { GlassDoor }                                  from '@features/scene/items/GlassDoor';
import { Toilet }                                     from '@features/scene/items/Toilet';
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
import { MackaparGroup }                              from '@features/scene/items/MackaparGroup';
import { SunnerstaGroup }                             from '@features/scene/items/SunnerstaGroup';
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
import { Mug }                                        from '@features/scene/items/Mug';
import { Counter }                                    from '@features/scene/items/Counter';
import { SinkBoholmen }                               from '@features/scene/items/SinkBoholmen';
import { NissedalMirror }                             from '@features/scene/items/NissedalMirror';
import { NinjaSP101 }                                 from '@features/scene/items/NinjaSP101';
import { MllseG2Pro }                                 from '@features/scene/items/MllseG2Pro';
import { JblCharge3 }                                 from '@features/scene/items/JblCharge3';
import { TrashBin }                                   from '@features/scene/items/TrashBin';

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
  'toilet':                 Toilet,
  'corridor-closet':        CorridorCloset,
  'sdb-closet':             SdbCloset,

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
  'meuble-t':               MeubleT,
  'utaker-stack':           UtakerStack,
  'desk-bollsidan':         BollsidanDesk,
  'mannequin-head':         MannequinHead,
  'backpack':               Backpack,
  'mug':                    Mug,
  'mirror-nissedal-wide':   NissedalMirror,
  'ninja-sp101':            NinjaSP101,
  'mini-pc':                MllseG2Pro,
  'jbl-charge3':            JblCharge3,
  'trash-bin':              TrashBin,

  // ── Composites (assemblages multi-pièces) ─────────────────────────────────
  'kallax-ne-stack':        KallaxNE,
  'kallax-sw-stack':        KallaxCuisine,
  'kallax-se-stack':        KallaxSE,
  'kallax-nw-stack':        KallaxNW,
  'mackapar-stack':         MackaparGroup,
  'sunnersta-stack':        SunnerstaGroup,
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
};
