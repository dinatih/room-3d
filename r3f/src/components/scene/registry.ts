/**
 * Registry des composants TSX dédiés par item.id.
 * Priorité max dans SceneContent — avant GLB et DimBox.
 *
 * Pour ajouter un objet interactif :
 *   1. Créer src/components/scene/items/MonObjet.tsx
 *   2. L'ajouter ici : 'mon-id': MonObjet
 */
import type { ComponentType } from 'react';
import type { SceneItemProps } from '../../types';
import { Freezer }                                    from './items/Freezer';
import { Fridge }                                     from './items/Fridge';
import { KitchenCabinet }                             from './items/KitchenCabinet';
import { BathroomCabinetWest, BathroomCabinetEast }  from './items/BathroomCabinet';
import { DoorEntry }                                  from './items/DoorEntry';
import { DoorLiving, DoorSdb }                        from './items/DoorWhite';
import { GlassDoor }                                  from './items/GlassDoor';
import { Kallax }                                      from './items/Kallax';
import { Toilet }                                      from './items/Toilet';
import { Shower }                                      from './items/Shower';
import { VasqueSdb }                                   from './items/VasqueSdb';
import { WaterHeater }                                 from './items/WaterHeater';
import { CorridorCloset }                              from './items/CorridorCloset';
import { TV }                                          from './items/TV';
import { Laptop }                                      from './items/Laptop';
import { Phone }                                       from './items/Phone';
import { AirPerformer }                                from './items/AirPerformer';
import { ArmrestSofa }                                 from './items/ArmrestSofa';
import { ArmlessSofa }                                 from './items/ArmlessSofa';
import { Viggja }                                      from './items/Viggja';
import { JoggingSuit }                                 from './items/JoggingSuit';
import { AltappenRug }                                 from './items/AltappenRug';
import { Smorkull }                                    from './items/Smorkull';
import { Sunnersta }                                   from './items/Sunnersta';
import { Scooter }                                     from './items/Scooter';
import { LampOla }                                     from './items/LampOla';
import { Mackapar }                                    from './items/Mackapar';
import { Salopette }                                   from './items/Salopette';
import { BaseballCap }                                 from './items/BaseballCap';
import { Bathtub }                                     from './items/Bathtub';
import { ChestBench }                                  from './items/ChestBench';
import { PottedPalm }                                  from './items/PottedPalm';
import { Drona }                                         from './items/Drona';
import { MeubleT }                                       from './items/MeubleT';
import { UtakerFrame }                                    from './items/UtakerFrame';
import { BollsidanDesk }                                  from './items/BollsidanDesk';
import { LackShelf }                                      from './items/LackShelf';
import { Fniss }                                          from './items/Fniss';
import { MannequinHead }                                  from './items/MannequinHead';

export const SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {
  'freezer':                 Freezer,
  'fridge':                  Fridge,
  'cabinet-wood':            KitchenCabinet,
  'bathroom-cabinet-west':   BathroomCabinetWest,
  'bathroom-cabinet-east':   BathroomCabinetEast,
  'door-entry':              DoorEntry,
  'door-living':             DoorLiving,
  'door-sdb':                DoorSdb,
  'door-glass':              GlassDoor,
  'kallax-ne-2x1':           Kallax,
  'kallax-ne-2x2':           Kallax,
  'kallax-se-2x1':           Kallax,
  'kallax-nw-2x1':           Kallax,
  'kallax-nw-1x1-a':         Kallax,
  'kallax-nw-1x1-b':         Kallax,
  'kallax-sw-2x2':           Kallax,
  'kallax-sw-2x1':           Kallax,
  'toilet':                  Toilet,
  'shower':                  Shower,
  'vasque-sdb':              VasqueSdb,
  'water-heater':            WaterHeater,
  'corridor-closet':         CorridorCloset,
  'tv':                      TV,
  'laptop':                  Laptop,
  'phone':                   Phone,
  'air-performer':           AirPerformer,
  'armrest-sofa':            ArmrestSofa,
  'armless-sofa':            ArmlessSofa,
  'bathtub':                 Bathtub,
  'chest-bench':             ChestBench,
  'potted-palm':             PottedPalm,
  'viggja':                  Viggja,
  'jogging-suit':            JoggingSuit,
  'altappen-rug':            AltappenRug,
  'smorkull-chair':          Smorkull,
  'sunnersta':               Sunnersta,
  'scooter':                 Scooter,
  'lamp-ola':                LampOla,
  'mackapar':                Mackapar,
  'salopette':               Salopette,
  'baseball-cap':            BaseballCap,
  'meuble-t':                MeubleT,
  'utaker-lower':            UtakerFrame,
  'utaker-upper':            UtakerFrame,
  'desk-bollsidan-1':        BollsidanDesk,
  'desk-bollsidan-2':        BollsidanDesk,
  'shelf-lack':              LackShelf,
  'basket-fniss':            Fniss,
  'mannequin-head':          MannequinHead,
  ...(Object.fromEntries(
    Array.from({ length: 29 }, (_, i) => [`drona-${i + 1}`, Drona]),
  ) as Record<string, ComponentType<SceneItemProps>>),
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
  'door-toggle':           ['Ouvrir', 'Fermer'],
  'wc-lid-toggle':         ['Ouvrir', 'Fermer'],
  'corr-doors-toggle':     ['Ouvrir', 'Fermer'],
};
