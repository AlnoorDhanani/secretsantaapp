/**
 * Constraint Validator
 *
 * Validates exclusion constraints before assignment generation.
 * Provides actionable feedback on potential issues.
 */

import type { Participant, ExclusionMap } from '../types';

export interface ConstraintValidation {
  /** Overall status of the constraints */
  status: 'valid' | 'warning' | 'error';
  /** Validation messages */
  messages: ValidationMessage[];
}

export interface ValidationMessage {
  /** Severity of the message */
  type: 'error' | 'warning' | 'info';
  /** Human-readable message */
  message: string;
  /** IDs of participants involved */
  participantIds?: string[];
}

/**
 * Validates exclusion constraints before generation.
 * Returns actionable feedback on potential issues.
 */
export function validateConstraints(
  participants: Participant[],
  exclusions: ExclusionMap
): ConstraintValidation {
  const messages: ValidationMessage[] = [];
  const n = participants.length;

  if (n < 2) {
    return {
      status: 'error',
      messages: [
        {
          type: 'error',
          message: 'Need at least 2 participants',
        },
      ],
    };
  }

  // Check each participant's exclusion count
  for (const p of participants) {
    const excludedCount = (exclusions[p.id] || []).length;
    const maxAllowed = n - 2; // Can exclude all but self and one other

    if (excludedCount > maxAllowed) {
      messages.push({
        type: 'error',
        message: `${p.name} has excluded too many people (${excludedCount}/${maxAllowed} max)`,
        participantIds: [p.id],
      });
    } else if (excludedCount === maxAllowed) {
      messages.push({
        type: 'warning',
        message: `${p.name} can only give to one person`,
        participantIds: [p.id],
      });
    }
  }

  // Check for mutual exclusion clusters
  const clusters = findMutualExclusionClusters(participants, exclusions);
  for (const cluster of clusters) {
    if (cluster.length >= n / 2) {
      const names = cluster.map(
        (id) => participants.find((p) => p.id === id)?.name || id
      );
      messages.push({
        type: 'warning',
        message: `High exclusion density among: ${names.join(', ')}`,
        participantIds: cluster,
      });
    }
  }

  // Check for participants who can't receive from anyone
  const recipientCounts = new Map<string, number>();
  for (const p of participants) {
    recipientCounts.set(p.id, 0);
  }

  for (const giver of participants) {
    const excluded = new Set(exclusions[giver.id] || []);
    excluded.add(giver.id); // Self-exclusion

    for (const recipient of participants) {
      if (!excluded.has(recipient.id)) {
        recipientCounts.set(
          recipient.id,
          (recipientCounts.get(recipient.id) || 0) + 1
        );
      }
    }
  }

  for (const [participantId, count] of recipientCounts) {
    if (count === 0) {
      const name = participants.find((p) => p.id === participantId)?.name;
      messages.push({
        type: 'error',
        message: `${name} cannot receive a gift from anyone`,
        participantIds: [participantId],
      });
    } else if (count === 1) {
      const name = participants.find((p) => p.id === participantId)?.name;
      messages.push({
        type: 'warning',
        message: `${name} can only receive from one person`,
        participantIds: [participantId],
      });
    }
  }

  // Determine overall status
  const hasErrors = messages.some((m) => m.type === 'error');
  const hasWarnings = messages.some((m) => m.type === 'warning');

  return {
    status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid',
    messages,
  };
}

/**
 * Finds groups of participants with high mutual exclusions.
 * Simple heuristic: group participants who mutually exclude each other.
 */
function findMutualExclusionClusters(
  participants: Participant[],
  exclusions: ExclusionMap
): string[][] {
  const clusters: string[][] = [];
  const visited = new Set<string>();

  for (const p of participants) {
    if (visited.has(p.id)) continue;

    const cluster = [p.id];
    visited.add(p.id);

    const pExclusions = new Set(exclusions[p.id] || []);

    for (const other of participants) {
      if (other.id === p.id || visited.has(other.id)) continue;

      const otherExclusions = new Set(exclusions[other.id] || []);

      // Check if they mutually exclude each other
      if (pExclusions.has(other.id) && otherExclusions.has(p.id)) {
        cluster.push(other.id);
        visited.add(other.id);
      }
    }

    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

/**
 * Gets a summary of constraint status for UI display.
 */
export function getConstraintSummary(
  participants: Participant[],
  exclusions: ExclusionMap
): {
  totalExclusions: number;
  participantsWithExclusions: number;
  maxExclusionsPerPerson: number;
} {
  let totalExclusions = 0;
  let participantsWithExclusions = 0;
  let maxExclusionsPerPerson = 0;

  for (const p of participants) {
    const count = (exclusions[p.id] || []).length;
    totalExclusions += count;
    if (count > 0) {
      participantsWithExclusions++;
    }
    maxExclusionsPerPerson = Math.max(maxExclusionsPerPerson, count);
  }

  return {
    totalExclusions,
    participantsWithExclusions,
    maxExclusionsPerPerson,
  };
}
