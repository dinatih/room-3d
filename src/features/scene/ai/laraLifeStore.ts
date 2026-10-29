import { create } from 'zustand';
import { createLife, type LifeMemory, type LifeNeeds } from './laraLife';

// Session-only state survives controller pauses and guided tours, never page reloads.
export const nativeLife = createLife();
export const LIFE_SPEEDS = [1, 3, 10] as const;
export const useLaraLifeStore = create<{ needs: LifeNeeds; memory: LifeMemory; elapsedSeconds: number; activity: string; reason: string; speed: typeof LIFE_SPEEDS[number] }>(() => ({
  needs: { ...nativeLife.needs }, memory: {}, elapsedSeconds: 0, activity: 'En attente', reason: 'Lara rejoint son bureau.', speed: 1,
}));
