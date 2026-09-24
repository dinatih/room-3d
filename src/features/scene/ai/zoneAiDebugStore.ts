import { create } from 'zustand';

export interface SelectedSlotInfo {
  objectId: string;
  slotId: string;
  actionId?: string;
}

interface ZoneAiDebugState {
  selectedSlot: SelectedSlotInfo | null;
  setSelectedSlot: (slot: SelectedSlotInfo | null) => void;
  selectedActionId: string | null;
  setSelectedActionId: (actionId: string | null) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  selectedCharId: string; // 'closest' | specific char id
  setSelectedCharId: (id: string) => void;
}

export const useZoneAiDebugStore = create<ZoneAiDebugState>((set) => ({
  selectedSlot: null,
  setSelectedSlot: (slot) => set({ selectedSlot: slot, selectedActionId: slot?.actionId ?? null, isOpen: true }),
  selectedActionId: null,
  setSelectedActionId: (selectedActionId) => set({ selectedActionId }),
  isOpen: true,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  selectedCharId: 'closest',
  setSelectedCharId: (selectedCharId) => set({ selectedCharId }),
}));
