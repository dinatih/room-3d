export interface Dims {
  w: number;  // largeur cm (X)
  d: number;  // profondeur cm (Z)
  h: number;  // hauteur cm (Y)
}

export interface Item {
  id: string;
  name: string;
  brand: string;
  category: string;
  qty: number;
  dims: Dims;
  scenePos: { x: number; z: number };
  notes?: string;
  glbPath?: string;
  actions?: string[];
}

export interface Category {
  id: string;
  label: string;
}

/** Props reçues par tout composant du SCENE_REGISTRY */
export interface SceneItemProps {
  item: Item;
  actionState: Record<string, boolean>;
  onSize: (size: import('three').Vector3) => void;
}
