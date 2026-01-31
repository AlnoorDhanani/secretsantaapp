/**
 * UI Store
 *
 * Zustand store for managing UI state.
 */

import { create } from 'zustand';

type Step = 'info' | 'participants' | 'exclusions' | 'generate' | 'distribution';

interface UIState {
  /** Current step in the draw wizard */
  currentStep: Step;
  /** Whether the vault is unlocked */
  vaultUnlocked: boolean;
  /** Set of participant IDs whose assignments have been revealed */
  revealedParticipants: Set<string>;
  /** Whether "show all" is enabled in the vault */
  showAllEnabled: boolean;
  /** Set of participant IDs whose messages have been copied */
  copiedParticipants: Set<string>;

  // Actions
  setStep: (step: Step) => void;
  nextStep: () => void;
  prevStep: () => void;
  unlockVault: () => void;
  lockVault: () => void;
  revealParticipant: (id: string) => void;
  enableShowAll: () => void;
  markCopied: (id: string) => void;
  resetUI: () => void;
}

const STEP_ORDER: Step[] = ['info', 'participants', 'exclusions', 'generate', 'distribution'];

export const useUIStore = create<UIState>((set, get) => ({
  currentStep: 'info',
  vaultUnlocked: false,
  revealedParticipants: new Set(),
  showAllEnabled: false,
  copiedParticipants: new Set(),

  setStep: (step) => {
    set({ currentStep: step });
  },

  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[currentIndex + 1] });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] });
    }
  },

  unlockVault: () => {
    set({ vaultUnlocked: true });
  },

  lockVault: () => {
    set({
      vaultUnlocked: false,
      revealedParticipants: new Set(),
      showAllEnabled: false,
    });
  },

  revealParticipant: (id) => {
    set((state) => ({
      revealedParticipants: new Set([...state.revealedParticipants, id]),
    }));
  },

  enableShowAll: () => {
    set({ showAllEnabled: true });
  },

  markCopied: (id) => {
    set((state) => ({
      copiedParticipants: new Set([...state.copiedParticipants, id]),
    }));
  },

  resetUI: () => {
    set({
      currentStep: 'info',
      vaultUnlocked: false,
      revealedParticipants: new Set(),
      showAllEnabled: false,
      copiedParticipants: new Set(),
    });
  },
}));
