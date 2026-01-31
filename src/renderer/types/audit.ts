/**
 * Audit log type definitions
 */

export interface AuditEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Type of action performed */
  action: AuditAction;
  /** Additional details about the action */
  details?: string;
}

export type AuditAction =
  | 'VAULT_ENTERED'
  | 'VAULT_SHOW_ALL'
  | 'ASSIGNMENT_REVEALED'
  | 'ASSIGNMENT_COPIED'
  | 'PRINT_INITIATED'
  | 'DRAW_GENERATED'
  | 'DRAW_REGENERATED';
