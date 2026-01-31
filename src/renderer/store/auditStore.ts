/**
 * Audit Store
 *
 * Zustand store for managing audit log entries.
 * Tracks sensitive operations like vault access and assignment reveals.
 */

import { create } from 'zustand';
import type { AuditEntry, AuditAction } from '../types';

interface AuditState {
  /** Audit log entries */
  entries: AuditEntry[];

  // Actions
  logAction: (action: AuditAction, details?: string) => void;
  getEntries: () => AuditEntry[];
  loadEntries: (entries: AuditEntry[]) => void;
  clearEntries: () => void;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],

  logAction: (action, details) => {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    set((state) => ({
      entries: [...state.entries, entry],
    }));
  },

  getEntries: () => get().entries,

  loadEntries: (entries) => {
    set({ entries });
  },

  clearEntries: () => {
    set({ entries: [] });
  },
}));
