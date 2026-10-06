export const AIRCRAFT_MODELS = [
  { key: 'origami', label: 'Origami', path: '/items/aircraft/origami.glb', yaw: Math.PI / 2 },
  { key: 'rocket', label: 'Fusée', path: '/items/plane-rocket/plane-rocket.glb', yaw: Math.PI / 2 },
  { key: 'comet', label: 'Comète', path: '/items/plane-comet/plane-comet.glb', yaw: Math.PI / 2 },
  { key: 'delorean', label: 'DeLorean', path: '/items/aircraft/delorean.glb', yaw: Math.PI },
  { key: 'police', label: 'Police volante', path: '/items/aircraft/police.glb', yaw: Math.PI },
  { key: 'korean-a380', label: 'Korean A380', path: '/items/aircraft/korean-a380.glb', yaw: Math.PI },
] as const;
export type PlaneModelKey = typeof AIRCRAFT_MODELS[number]['key'];
