/**
 * Assignment type definitions
 */

export interface Assignment {
  /** ID of the giver */
  giverId: string;
  /** ID of the recipient */
  recipientId: string;
}

export interface GenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Generated assignments (only present if successful) */
  assignments?: Assignment[];
  /** Error information (only present if failed) */
  error?: GenerationError;
}

export interface GenerationError {
  /** Type of error */
  type: 'UNSATISFIABLE' | 'TOO_FEW_PARTICIPANTS' | 'INTERNAL_ERROR';
  /** Human-readable error message */
  message: string;
  /** Actionable suggestions for fixing the issue */
  details?: string[];
  /** IDs of participants causing issues */
  problematicParticipants?: string[];
}
