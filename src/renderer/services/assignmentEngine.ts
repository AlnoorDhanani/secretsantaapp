/**
 * Assignment Engine
 *
 * Generates Secret Santa assignments using randomized constraint propagation.
 * Implements bipartite perfect matching with exclusion constraints.
 */

import type { Participant, ExclusionMap, Assignment, GenerationResult, GenerationError } from '../types';

/**
 * Generates Secret Santa assignments.
 *
 * Algorithm:
 * 1. Build adjacency matrix of valid assignments (who can give to whom)
 * 2. Check if a perfect matching is possible (using augmenting paths)
 * 3. If possible, generate random perfect matching using randomized DFS
 * 4. If not possible, identify problematic constraints
 */
export function generateAssignments(
  participants: Participant[],
  exclusions: ExclusionMap
): GenerationResult {
  const n = participants.length;

  // Edge case: need at least 2 participants
  if (n < 2) {
    return {
      success: false,
      error: {
        type: 'TOO_FEW_PARTICIPANTS',
        message: 'Need at least 2 participants for Secret Santa.',
        details: ['Add more participants to create a valid draw.'],
      },
    };
  }

  // Build adjacency list: who can each giver give to?
  const canGiveTo = buildAdjacencyList(participants, exclusions);

  // Validate that a perfect matching exists
  const validation = validateMatchingPossible(participants, canGiveTo);
  if (!validation.possible) {
    return {
      success: false,
      error: validation.error,
    };
  }

  // Generate random perfect matching
  const assignments = findRandomPerfectMatching(participants, canGiveTo);

  if (!assignments) {
    // This shouldn't happen if validation passed, but handle gracefully
    return {
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to generate assignments despite valid configuration.',
        details: ['Please try again or report this issue.'],
      },
    };
  }

  return {
    success: true,
    assignments,
  };
}

/**
 * Builds adjacency list of valid giver -> recipient pairs.
 * Excludes self-assignments and explicit exclusions.
 */
function buildAdjacencyList(
  participants: Participant[],
  exclusions: ExclusionMap
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const giver of participants) {
    const excluded = new Set(exclusions[giver.id] || []);
    excluded.add(giver.id); // No self-assignment

    const validRecipients = participants
      .filter((r) => !excluded.has(r.id))
      .map((r) => r.id);

    adjacency.set(giver.id, validRecipients);
  }

  return adjacency;
}

/**
 * Validates that a perfect matching is possible.
 * Uses iterative augmenting path algorithm.
 */
function validateMatchingPossible(
  participants: Participant[],
  canGiveTo: Map<string, string[]>
): { possible: boolean; error?: GenerationError } {
  const n = participants.length;
  const participantIds = participants.map((p) => p.id);

  // Quick check: each giver must have at least one valid recipient
  for (const giver of participants) {
    const validRecipients = canGiveTo.get(giver.id) || [];
    if (validRecipients.length === 0) {
      return {
        possible: false,
        error: {
          type: 'UNSATISFIABLE',
          message: `"${giver.name}" has no valid recipients.`,
          details: [
            `Remove some exclusions for ${giver.name}`,
            'Or add more participants to the draw',
          ],
          problematicParticipants: [giver.id],
        },
      };
    }
  }

  // Try to find a perfect matching using augmenting paths
  const matching = findMaximumMatching(participantIds, canGiveTo);

  if (matching.size < n) {
    // Find who couldn't be matched
    const unmatched = participantIds.filter((id) => !matching.has(id));
    const unmatchedNames = unmatched.map(
      (id) => participants.find((p) => p.id === id)?.name || id
    );

    return {
      possible: false,
      error: {
        type: 'UNSATISFIABLE',
        message: 'The current exclusions make a valid assignment impossible.',
        details: [
          `Problem involves: ${unmatchedNames.join(', ')}`,
          'Try removing some exclusions between these participants',
          'Or add more participants to the draw',
        ],
        problematicParticipants: unmatched,
      },
    };
  }

  return { possible: true };
}

/**
 * Finds maximum matching using augmenting paths (Hungarian algorithm variant).
 * Returns map of giverId -> recipientId.
 */
function findMaximumMatching(
  giverIds: string[],
  canGiveTo: Map<string, string[]>
): Map<string, string> {
  const matching = new Map<string, string>(); // giver -> recipient
  const reverseMatching = new Map<string, string>(); // recipient -> giver

  for (const giverId of giverIds) {
    const visited = new Set<string>();
    augmentPath(giverId, canGiveTo, matching, reverseMatching, visited);
  }

  return matching;
}

/**
 * Attempts to find an augmenting path from the given giver.
 * Returns true if path found and matching extended.
 */
function augmentPath(
  giverId: string,
  canGiveTo: Map<string, string[]>,
  matching: Map<string, string>,
  reverseMatching: Map<string, string>,
  visited: Set<string>
): boolean {
  const recipients = canGiveTo.get(giverId) || [];

  for (const recipientId of recipients) {
    if (visited.has(recipientId)) continue;
    visited.add(recipientId);

    const currentGiver = reverseMatching.get(recipientId);

    if (
      !currentGiver ||
      augmentPath(currentGiver, canGiveTo, matching, reverseMatching, visited)
    ) {
      matching.set(giverId, recipientId);
      reverseMatching.set(recipientId, giverId);
      return true;
    }
  }

  return false;
}

/**
 * Generates a random perfect matching.
 * Shuffles the order of exploration to ensure randomness.
 */
function findRandomPerfectMatching(
  participants: Participant[],
  canGiveTo: Map<string, string[]>
): Assignment[] | null {
  const giverIds = cryptoShuffle([...participants.map((p) => p.id)]);

  // Shuffle each giver's recipient list for randomness
  const randomizedAdjacency = new Map<string, string[]>();
  for (const [giverId, recipients] of canGiveTo) {
    randomizedAdjacency.set(giverId, cryptoShuffle([...recipients]));
  }

  // Find matching with randomized exploration order
  const matching = new Map<string, string>();
  const reverseMatching = new Map<string, string>();

  for (const giverId of giverIds) {
    const visited = new Set<string>();
    if (
      !augmentPath(
        giverId,
        randomizedAdjacency,
        matching,
        reverseMatching,
        visited
      )
    ) {
      return null; // Should not happen if validation passed
    }
  }

  // Convert to Assignment array
  return participants.map((p) => ({
    giverId: p.id,
    recipientId: matching.get(p.id)!,
  }));
}

/**
 * Cryptographically secure Fisher-Yates shuffle.
 * Uses Web Crypto API for randomness.
 */
function cryptoShuffle<T>(array: T[]): T[] {
  const result = [...array];
  const randomValues = new Uint32Array(result.length);
  crypto.getRandomValues(randomValues);

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
