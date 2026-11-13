import { create } from 'zustand';

export const ROBOT_SUBJECTS: Record<string, string> = {
  'black-hornet-drone': 'drone', 'ring-drone-cam': 'ring-drone-cam',
  'unitree-g1': 'unitree-g1', microduck: 'microduck', 'jumper-robot': 'jumper-robot',
  'unitree-h2': 'unitree-h2', 'unitree-as2w': 'unitree-as2w', 'raph-rover': 'raph-rover',
};
export const useRobotVisibility = create<{
  visible: string[];
  toggle: (id: string) => void;
}>(set => ({
  visible: ['black-hornet-drone', 'ring-drone-cam', 'unitree-g1', 'microduck', 'jumper-robot'],
  toggle: id => set(state => ({ visible: state.visible.includes(id) ? state.visible.filter(value => value !== id) : [...state.visible, id] })),
}));
export const isRobotSubjectVisible = (id: string, visible: string[]) =>
  !Object.values(ROBOT_SUBJECTS).includes(id) || Object.entries(ROBOT_SUBJECTS).some(([item, subject]) => subject === id && visible.includes(item));
