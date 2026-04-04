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
import { Freezer } from './items/Freezer';

export const SCENE_REGISTRY: Record<string, ComponentType<SceneItemProps>> = {
  'freezer': Freezer,
};

/**
 * Labels des boutons d'action.
 * [label quand inactif, label quand actif]
 */
export const ACTION_LABELS: Record<string, [string, string]> = {
  'freezer-toggle': ['Ouvrir', 'Fermer'],
};
