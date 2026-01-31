/**
 * Draw Store
 *
 * Zustand store for managing draw state.
 */

import { create } from 'zustand';
import type { Draw, Participant, ExclusionMap, AssignmentMap } from '../types';
import { createDraw } from '../types';
import { createParticipant } from '../types';

interface DrawState {
  /** Current draw being edited */
  currentDraw: Draw | null;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Path to the current file (if saved) */
  filePath: string | null;

  // Actions
  createNewDraw: (name: string) => void;
  loadDraw: (draw: Draw, filePath?: string) => void;
  updateDrawInfo: (updates: Partial<Pick<Draw, 'name' | 'year' | 'budget' | 'notes'>>) => void;
  addParticipant: (name: string, phoneNumber?: string) => void;
  updateParticipant: (id: string, updates: Partial<Pick<Participant, 'name' | 'phoneNumber'>>) => void;
  removeParticipant: (id: string) => void;
  setExclusions: (giverId: string, excludedIds: string[]) => void;
  setAssignments: (assignments: AssignmentMap) => void;
  clearAssignments: () => void;
  markSaved: (filePath?: string) => void;
  reset: () => void;
}

export const useDrawStore = create<DrawState>((set, get) => ({
  currentDraw: null,
  isDirty: false,
  filePath: null,

  createNewDraw: (name) => {
    set({
      currentDraw: createDraw(name),
      isDirty: true,
      filePath: null,
    });
  },

  loadDraw: (draw, filePath) => {
    set({
      currentDraw: draw,
      isDirty: false,
      filePath: filePath || null,
    });
  },

  updateDrawInfo: (updates) => {
    const { currentDraw } = get();
    if (!currentDraw) return;

    set({
      currentDraw: {
        ...currentDraw,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  addParticipant: (name, phoneNumber) => {
    const { currentDraw } = get();
    if (!currentDraw) return;

    const newParticipant = createParticipant(name, phoneNumber);

    set({
      currentDraw: {
        ...currentDraw,
        participants: [...currentDraw.participants, newParticipant],
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  updateParticipant: (id, updates) => {
    const { currentDraw } = get();
    if (!currentDraw) return;

    set({
      currentDraw: {
        ...currentDraw,
        participants: currentDraw.participants.map((p) =>
          p.id === id
            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
            : p
        ),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  removeParticipant: (id) => {
    const { currentDraw } = get();
    if (!currentDraw) return;

    // Remove participant and clean up any exclusions referencing them
    const newExclusions: ExclusionMap = {};
    for (const [giverId, excludedIds] of Object.entries(currentDraw.exclusions)) {
      if (giverId !== id) {
        newExclusions[giverId] = excludedIds.filter((eid) => eid !== id);
      }
    }

    set({
      currentDraw: {
        ...currentDraw,
        participants: currentDraw.participants.filter((p) => p.id !== id),
        exclusions: newExclusions,
        assignments: undefined, // Clear assignments when participants change
        generatedAt: undefined,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  setExclusions: (giverId, excludedIds) => {
    const { currentDraw } = get();
    if (!currentDraw) return;

    set({
      currentDraw: {
        ...currentDraw,
        exclusions: {
          ...currentDraw.exclusions,
          [giverId]: excludedIds,
        },
        assignments: undefined, // Clear assignments when exclusions change
        generatedAt: undefined,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  setAssignments: (assignments) => {
    const { currentDraw } = get();
    if (!currentDraw) return;

    set({
      currentDraw: {
        ...currentDraw,
        assignments,
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  clearAssignments: () => {
    const { currentDraw } = get();
    if (!currentDraw) return;

    set({
      currentDraw: {
        ...currentDraw,
        assignments: undefined,
        generatedAt: undefined,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  markSaved: (filePath) => {
    set({
      isDirty: false,
      filePath: filePath || get().filePath,
    });
  },

  reset: () => {
    set({
      currentDraw: null,
      isDirty: false,
      filePath: null,
    });
  },
}));
