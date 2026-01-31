/**
 * Participant type definitions
 */

export interface Participant {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name (required, trimmed) */
  name: string;
  /** Phone number in E.164 format (+1XXXXXXXXXX) or undefined */
  phoneNumber?: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Normalizes a name for duplicate detection.
 * Trims whitespace and converts to lowercase.
 */
export function normalizeNameForComparison(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Creates a new participant with generated ID and timestamps.
 */
export function createParticipant(
  name: string,
  phoneNumber?: string
): Participant {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    phoneNumber,
    createdAt: now,
    updatedAt: now,
  };
}
