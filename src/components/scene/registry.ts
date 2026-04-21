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
import { Kallax2x1 }                                    from './items/Kallax2x1';
import { Kallax2x2 }                                    from './items/Kallax2x2';
import { Kallax1x1 }                                    from './items/Kallax1x1';
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
import { MackaparGroup }                               from './items/MackaparGroup';
import { Mackapar }                                    from './items/Mackapar';
import { Salopette }                                   from './items/Salopette';
import { BaseballCap }                                 from './items/BaseballCap';
import { Sneakers }                                    from './items/Sneakers';
import { JordanHexMule }                               from './items/JordanHexMule';
import { Bathtub }                                     from './items/Bathtub';
import { ChestBench }                                  from './items/ChestBench';
import { PottedPalm }                                  from './items/PottedPalm';
import { PalmLeaf }                                    from './items/PalmLeaf';
import { Drona }                                         from './items/Drona';
import { MeubleT }                                       from './items/MeubleT';
import { UtakerFrame }                                    from './items/UtakerFrame';
import { BollsidanDesk }                                  from './items/BollsidanDesk';
import { LackShelf }                                      from './items/LackShelf';
import { Fniss }                                          from './items/Fniss';
import { MannequinHead }                                  from './items/MannequinHead';
import { SdbCloset }                                      from './items/SdbCloset';
import { KallaxNE }                                        from './items/KallaxNE';
import { KallaxSE }                                        from './items/KallaxSE';
import { KallaxNW }                                        from './items/KallaxNW';
import { Backpack }                                        from './items/Backpack';
import { Mug }                                            from './items/Mug';
import { NissedalMirror }                                 from './items/NissedalMirror';
import { MuligRail }                                      from './items/MuligRail';
import { Counter }                                        from './items/Counter';
import { SinkBoholmen }                                   from './items/SinkBoholmen';
import { Stove }                                          from './items/Stove';
import { Dimpa }                                          from './items/Dimpa';
import { KallaxCuisine }                                  from './items/KallaxCuisine';
import { SunnerstaGroup }                                 from './items/SunnerstaGroup';
import { CuisineGroup }                                   from './items/CuisineGroup';

export const SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {
  'dimpa':                   Dimpa,
  'counter':                 Counter,
  'sink-boholmen':           SinkBoholmen,
  'stove':                   Stove,
  'freezer':                 Freezer,
  'fridge':                  Fridge,
  'cabinet-wood':            KitchenCabinet,
  'bathroom-cabinet-west':   BathroomCabinetWest,
  'bathroom-cabinet-east':   BathroomCabinetEast,
  'door-entry':              DoorEntry,
  'door-living':             DoorLiving,
  'door-sdb':                DoorSdb,
  'door-glass':              GlassDoor,
  'kallax-ne-stack':         KallaxNE,
  'kallax-sw-stack':         KallaxCuisine,
  'kallax-se-stack':         KallaxSE,
  'kallax-nw-stack':         KallaxNW,
  'kallax-ne-2x1':           Kallax2x1,
  'kallax-ne-2x2':           Kallax2x2,
  'kallax-se-2x1':           Kallax2x1,
  'kallax-nw-2x1':           Kallax2x1,
  'kallax-nw-1x1-a':         Kallax1x1,
  'kallax-nw-1x1-b':         Kallax1x1,
  'kallax-sw-2x2':           Kallax2x2,
  'kallax-sw-2x2-spec':      Kallax2x2,
  'kallax-sw-2x1':           Kallax2x1,
  'toilet':                  Toilet,
  'shower':                  Shower,
  'vasque-sdb':              VasqueSdb,
  'water-heater':            WaterHeater,
  'corridor-closet':         CorridorCloset,
  'sdb-closet':              SdbCloset,
  'tv':                      TV,
  'laptop':                  Laptop,
  'phone':                   Phone,
  'air-performer':           AirPerformer,
  'armrest-sofa':            ArmrestSofa,
  'armless-sofa':            ArmlessSofa,
  'bathtub':                 Bathtub,
  'chest-bench':             ChestBench,
  'potted-palm':             PottedPalm,
  'palm-leaf':               PalmLeaf,
  'viggja':                  Viggja,
  'jogging-suit':            JoggingSuit,
  'altappen-rug':            AltappenRug,
  'smorkull-chair':          Smorkull,
  'sunnersta':               Sunnersta,
  'sunnersta-stack':         SunnerstaGroup,
  'cuisine-stack':           CuisineGroup,
  'scooter':                 Scooter,
  'lamp-ola':                LampOla,
  'mackapar-stack':          MackaparGroup,
  'mackapar':                Mackapar,
  'salopette':               Salopette,
  'baseball-cap':            BaseballCap,
  'sneaker':                 Sneakers,
  'jordan-hex-mule':         JordanHexMule,
  'meuble-t':                MeubleT,
  'utaker-lower':            UtakerFrame,
  'utaker-upper':            UtakerFrame,
  'desk-bollsidan-1':        BollsidanDesk,
  'desk-bollsidan-2':        BollsidanDesk,
  'shelf-lack':              LackShelf,
  'basket-fniss':            Fniss,
  'mannequin-head':          MannequinHead,
  'backpack':                Backpack,
  'mug':                     Mug,
  'mirror-nissedal-a':       NissedalMirror,
  'mirror-nissedal-wide':    NissedalMirror,
  'mirror-nissedal-d':       NissedalMirror,
  'rail-mulig':              MuligRail,
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
  'sdb-closet-toggle':     ['Ouvrir', 'Fermer'],
};
