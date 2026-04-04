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
};
