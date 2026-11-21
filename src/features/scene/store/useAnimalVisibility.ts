import { create } from 'zustand';

export const ANIMAL_SUBJECTS: Record<string, string> = {
  ushiro: 'shiba',
  'dachshund-sculpt': 'ulotte',
  'robin-bird': 'robin',
  'animated-pitbull-dog': 'animated-pitbull-dog',
  'labrador-dog-from-cotw-game': 'labrador-dog-from-cotw-game',
  'bloodhund-from-cotw-game-ears-has-animglitch': 'bloodhund-from-cotw-game-ears-has-animglitch',
  'jikin-goldfish': 'jikin',
  'tosakin-goldfish': 'tosakin',
  'comet-goldfish': 'comet',
};

export const useAnimalVisibility = create<{
  visible: string[];
  toggle: (id: string) => void;
}>(set => ({
  visible: ['ushiro', 'dachshund-sculpt', 'robin-bird', 'comet-goldfish'],
  toggle: id => set(state => ({
    visible: state.visible.includes(id)
      ? state.visible.filter(value => value !== id)
      : [...state.visible, id],
  })),
}));

export const isAnimalSubjectVisible = (id: string, visible: string[]) =>
  !Object.values(ANIMAL_SUBJECTS).includes(id) ||
  Object.entries(ANIMAL_SUBJECTS).some(([item, subject]) => subject === id && visible.includes(item));
