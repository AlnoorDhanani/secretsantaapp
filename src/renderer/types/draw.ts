/**
 * Draw type definitions
 */

import type { Participant } from './participant';

/** Map of giver ID to array of excluded recipient IDs */
export type ExclusionMap = Record<string, string[]>;

/** Map of giver ID to assigned recipient ID */
export type AssignmentMap = Record<string, string>;

export interface Draw {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Schema version (1 for MVP) */
  version: number;
  /** Draw name (required) */
  name: string;
  /** Optional year/label */
  year?: string;
  /** Optional budget notes */
  budget?: string;
  /** Optional general notes */
  notes?: string;
  /** All participants */
  participants: Participant[];
  /** Exclusion rules: giver ID -> excluded recipient IDs */
  exclusions: ExclusionMap;
  /** Assignments (only present if generated & saved) */
  assignments?: AssignmentMap;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
  /** ISO 8601 timestamp of when assignments were generated */
  generatedAt?: string;
}

/**
 * Creates a new empty draw with generated ID and timestamps.
 */
export function createDraw(name: string): Draw {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    version: 1,
    name: name.trim(),
    participants: [],
    exclusions: {},
    createdAt: now,
    updatedAt: now,
  };
}
