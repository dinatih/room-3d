import { create } from 'zustand';
import { Vector3 } from 'three';

export const droneInput = { keys: new Set<string>(), yaw: 0, pitch: 0 };

export const useDroneControlStore = create<{
  available: boolean;
  piloting: boolean;
  speed: number;
  pitch: number;
  panelOpen: boolean;
  setPiloting: (piloting: boolean) => void;
  setSpeed: (speed: number) => void;
}>(set => ({
  available: false,
  piloting: false,
  speed: 160, // cm/s, comme le vol autonome.
  pitch: 0,
  panelOpen: false,
  setPiloting: piloting => { droneInput.keys.clear(); set({ piloting }); },
  setSpeed: speed => set({ speed }),
}));

/** Déplacement relatif au regard, normalisé pour conserver la vitesse en diagonale. */
export function droneMovement(keys: Set<string>, yaw: number, pitch: number, target: Vector3): Vector3 {
  const held = (...names: string[]) => names.some(name => keys.has(name) && !(keys.has('Alt') && name.startsWith('Arrow')));
  const forward = Number(held('z', 'w', 'ArrowUp', 'character:ArrowUp')) - Number(held('s', 'ArrowDown', 'character:ArrowDown'));
  const right = Number(held('d', 'ArrowRight', 'character:ArrowRight')) - Number(held('q', 'a', 'ArrowLeft', 'character:ArrowLeft'));
  const up = Number(held(' ', 'character:Elevate', 'camera:Elevate')) - Number(held('c', 'character:Descend', 'camera:Descend'));
  target.set(
    Math.sin(yaw) * Math.cos(pitch) * forward - Math.cos(yaw) * right,
    Math.sin(pitch) * forward + up,
    Math.cos(yaw) * Math.cos(pitch) * forward + Math.sin(yaw) * right,
  );
  if (target.lengthSq() > 1) target.normalize();
  return target;
}
