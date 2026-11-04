import type { LifeActivity, LifePhase } from './laraLife';

export const HOME_ROOMS = { living: 'Séjour', bathroom: 'Salle de bain', corridor: 'Entrée', garden: 'Jardin' };
export type HomeRoom = keyof typeof HOME_ROOMS;
export const HOME_TASKS = {
  toilet: { room: 'bathroom', objectId: 'toilet', slotId: 'clean', label: 'Nettoyer les toilettes' },
  dishes: { room: 'living', objectId: 'cuisine-group', slotId: 'wash-dishes', label: 'Faire la vaisselle' },
  living: { room: 'living', objectId: 'clean-floor-living', slotId: 'sweep', label: 'Balayer le séjour' },
  bathroom: { room: 'bathroom', objectId: 'clean-floor-bathroom', slotId: 'sweep', label: 'Balayer la salle de bain' },
  corridor: { room: 'corridor', objectId: 'clean-floor-corridor', slotId: 'sweep', label: 'Balayer l’entrée' },
  garden: { room: 'garden', objectId: 'clean-floor-garden', slotId: 'sweep', label: 'Balayer la terrasse' },
} as const;
export type HomeTask = keyof typeof HOME_TASKS;
export type HomeDirt = Record<HomeTask, number>;
// Dirt follows use: one six-second toilet visit adds 12%, one metre walked adds 1%.
export const HOME_RATES = { toilet: 2, dishes: 1, floorPerCm: 0.01, cleaning: 5 };
export const createHomeDirt = (): HomeDirt => ({ toilet: 0, dishes: 0, living: 0, bathroom: 0, corridor: 0, garden: 0 });
export const homeDirt = createHomeDirt();

export function getHomeTask(objectId?: string, slotId?: string): HomeTask | undefined {
  return (Object.keys(HOME_TASKS) as HomeTask[]).find(key => HOME_TASKS[key].objectId === objectId && HOME_TASKS[key].slotId === slotId?.split(':')[0]);
}

export function roomDirt(dirt: HomeDirt, room: HomeRoom): number {
  return Math.max(...(Object.keys(HOME_TASKS) as HomeTask[]).filter(key => HOME_TASKS[key].room === room).map(key => dirt[key]));
}

export function evolveHome(dirt: HomeDirt, context: { activity: LifeActivity | null; phase?: LifePhase; seconds: number;
  distance: number; room: HomeRoom; objectId?: string; slotId?: string }) {
  const { activity, phase, seconds, distance, room, objectId, slotId } = context;
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(distance) || distance < 0) throw new Error('Invalid housekeeping duration or distance');
  const change = (key: HomeTask, amount: number) => {
    if (!Number.isFinite(dirt[key]) || dirt[key] < 0 || dirt[key] > 100) throw new Error(`Invalid dirt for ${key}`);
    dirt[key] = Math.max(0, Math.min(100, dirt[key] + amount));
  };
  change(room, distance * HOME_RATES.floorPerCm);
  if (activity === 'toilet') change('toilet', seconds * HOME_RATES.toilet);
  if (activity === 'meal' || phase === 'prepare-meal') change('dishes', seconds * HOME_RATES.dishes);
  if (activity === 'clean' && seconds > 0) {
    const task = getHomeTask(objectId, slotId);
    if (!task) throw new Error(`Unknown cleaning task ${objectId}:${slotId}`);
    change(task, -seconds * HOME_RATES.cleaning);
  }
}
