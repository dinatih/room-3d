/**
 * Registry des composants TSX dédiés par item.id.
 * Priorité max dans SceneContent — avant GLB et DimBox.
 *
 * Pour ajouter un objet interactif :
 *   1. Créer src/components/scene/items/MonObjet.tsx
 *   2. L'ajouter ici : 'mon-id': MonObjet
 */
import type { ComponentType } from 'react';
import type { SceneItemProps } from '@shared/types';
import { Freezer }                                    from '@features/scene/items/Freezer';
import { Fridge }                                     from '@features/scene/items/Fridge';
import { KitchenCabinet }                             from '@features/scene/items/KitchenCabinet';
import { BathroomCabinetWest, BathroomCabinetEast }  from '@features/scene/items/BathroomCabinet';
import { DoorEntry }                                  from '@features/scene/items/DoorEntry';
import { DoorLiving, DoorSdb }                        from '@features/scene/items/DoorWhite';
import { GlassDoor }                                  from '@features/scene/items/GlassDoor';
import { Kallax2x1 }                                    from '@features/scene/items/Kallax2x1';
import { Kallax2x2 }                                    from '@features/scene/items/Kallax2x2';
import { Kallax1x1 }                                    from '@features/scene/items/Kallax1x1';
import { Toilet }                                      from '@features/scene/items/Toilet';
import { Shower }                                      from '@features/scene/items/Shower';
import { VasqueSdb }                                   from '@features/scene/items/VasqueSdb';
import { WaterHeater }                                 from '@features/scene/items/WaterHeater';
import { CorridorCloset }                              from '@features/scene/items/CorridorCloset';
import { TV }                                          from '@features/scene/items/TV';
import { Laptop }                                      from '@features/scene/items/Laptop';
import { Phone }                                       from '@features/scene/items/Phone';
import { AirPerformer }                                from '@features/scene/items/AirPerformer';
import { ArmrestSofa }                                 from '@features/scene/items/ArmrestSofa';
import { ArmlessSofa }                                 from '@features/scene/items/ArmlessSofa';
import { Viggja }                                      from '@features/scene/items/Viggja';
import { JoggingSuit }                                 from '@features/scene/items/JoggingSuit';
import { AltappenRug }                                 from '@features/scene/items/AltappenRug';
import { Smorkull }                                    from '@features/scene/items/Smorkull';
import { Sunnersta }                                   from '@features/scene/items/Sunnersta';
import { Scooter }                                     from '@features/scene/items/Scooter';
import { LampOla }                                     from '@features/scene/items/LampOla';
import { MackaparGroup }                               from '@features/scene/items/MackaparGroup';
import { Mackapar }                                    from '@features/scene/items/Mackapar';
import { Salopette }                                   from '@features/scene/items/Salopette';
import { BaseballCap }                                 from '@features/scene/items/BaseballCap';
import { Sneakers }                                    from '@features/scene/items/Sneakers';
import { JordanHexMule }                               from '@features/scene/items/JordanHexMule';
import { Bathtub }                                     from '@features/scene/items/Bathtub';
import { ChestBench }                                  from '@features/scene/items/ChestBench';
import { PottedPalm }                                  from '@features/scene/items/PottedPalm';
import { PalmLeaf }                                    from '@features/scene/items/PalmLeaf';
import { MeubleT }                                       from '@features/scene/items/MeubleT';
import { UtakerFrame }                                    from '@features/scene/items/UtakerFrame';
import { BollsidanDesk }                                  from '@features/scene/items/BollsidanDesk';
import { LackShelf }                                      from '@features/scene/items/LackShelf';
import { Fniss }                                          from '@features/scene/items/Fniss';
import { MannequinHead }                                  from '@features/scene/items/MannequinHead';
import { SdbCloset }                                      from '@features/scene/items/SdbCloset';
import { KallaxNE }                                        from '@features/scene/items/KallaxNE';
import { KallaxSE }                                        from '@features/scene/items/KallaxSE';
import { KallaxNW }                                        from '@features/scene/items/KallaxNW';
import { Backpack }                                        from '@features/scene/items/Backpack';
import { Mug }                                            from '@features/scene/items/Mug';
import { NissedalMirror }                                 from '@features/scene/items/NissedalMirror';
import { MuligRail }                                      from '@features/scene/items/MuligRail';
import { Counter }                                        from '@features/scene/items/Counter';
import { SinkBoholmen }                                   from '@features/scene/items/SinkBoholmen';
import { Stove }                                          from '@features/scene/items/Stove';
import { Dimpa }                                          from '@features/scene/items/Dimpa';
import { KallaxCuisine }                                  from '@features/scene/items/KallaxCuisine';
import { SunnerstaGroup }                                 from '@features/scene/items/SunnerstaGroup';
import { CuisineGroup }                                   from '@features/scene/items/CuisineGroup';

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
